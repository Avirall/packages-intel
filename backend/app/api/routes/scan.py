import asyncio
import logging
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, status

from app.api.deps import get_current_user
from app.api.utils import get_owned_scan, scan_to_response
from app.core.config import settings
from app.db.mongodb import scans_collection
from app.db.neo4j import run_query
from app.models.scan import ScanDocument
from app.schemas.scan import PackageRisk, ScanResponse
from app.services import graph_loader
from app.services.fetchers import depsdev, github, registries
from app.services.parsers import SUPPORTED_FILENAMES, detect_and_parse
from app.services.risk import compute_risk

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/scan", tags=["scan"])


# ── upload ────────────────────────────────────────────────────────────────────

@router.post("/upload", response_model=ScanResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_file(
    file: UploadFile,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    filename = file.filename or ""
    if filename not in SUPPORTED_FILENAMES:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"Unsupported file. Supported: {', '.join(sorted(SUPPORTED_FILENAMES))}",
        )

    raw = await file.read()
    if len(raw) > settings.max_upload_bytes:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            f"File exceeds {settings.max_upload_bytes // 1024} KB limit",
        )

    try:
        content = raw.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "File must be UTF-8 encoded")

    try:
        ecosystem, package_names = detect_and_parse(filename, content)
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc))

    if not package_names:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "No packages found in file")

    doc = ScanDocument(
        user_id=current_user["_id"],
        filename=filename,
        ecosystem=ecosystem,
        package_names=package_names,
    )
    result = await scans_collection().insert_one(doc.model_dump(exclude={"id"}))
    scan_id = str(result.inserted_id)

    background_tasks.add_task(
        _run_scan,
        scan_id=scan_id,
        package_names=package_names,
        ecosystem=ecosystem,
        user_email=current_user["email"],
    )

    inserted = await scans_collection().find_one({"_id": result.inserted_id})
    return scan_to_response(inserted)


# ── get scan ──────────────────────────────────────────────────────────────────

@router.get("/{scan_id}", response_model=ScanResponse)
async def get_scan(scan_id: str, current_user: dict = Depends(get_current_user)):
    doc = await get_owned_scan(scan_id, current_user)
    return scan_to_response(doc)


# ── packages list ─────────────────────────────────────────────────────────────

@router.get("/{scan_id}/packages", response_model=list[PackageRisk])
async def get_packages(scan_id: str, current_user: dict = Depends(get_current_user)):
    doc = await get_owned_scan(scan_id, current_user)
    if doc["status"] != "completed":
        return []

    neo4j_id = doc.get("neo4j_scan_id")
    if not neo4j_id:
        return []

    rows = await run_query(
        """
        MATCH (s:Scan {id: $scan_id})-[inc:INCLUDES]->(p:Package)
        OPTIONAL MATCH (p)-[:HOSTED_AT]->(r:Repository)
        OPTIONAL MATCH (r)-[mb:MAINTAINED_BY]->(c:Contributor)
        RETURN p, r, inc.is_direct AS is_direct,
               collect({
                 login:       c.login,
                 commits_90d: mb.commits_last_90d,
                 last_commit: c.last_commit_date
               }) AS maintainers
        ORDER BY p.risk_score DESC
        """,
        {"scan_id": neo4j_id},
    )

    packages: list[PackageRisk] = []
    for row in rows:
        p = row["p"]
        r = row.get("r") or {}
        packages.append(PackageRisk(
            name=p["name"],
            ecosystem=p["ecosystem"],
            weekly_downloads=p.get("weekly_downloads", 0),
            bus_factor=p.get("bus_factor", 0),
            risk_score=p.get("risk_score", 0.0),
            risk_label=p.get("risk_label", "LOW"),
            last_release_months_ago=p.get("last_release_months_ago"),
            last_commit_at=r.get("last_commit_at"),
            open_issues=r.get("open_issues"),
            scorecard_score=r.get("scorecard_score"),
            maintainers=[m for m in (row.get("maintainers") or []) if m.get("login")],
            hops_from_root=None,
        ))

    return packages


# ── background scan pipeline ──────────────────────────────────────────────────

async def _run_scan(
    scan_id: str,
    package_names: list[str],
    ecosystem: str,
    user_email: str,
) -> None:
    col = scans_collection()
    await col.update_one(
        {"_id": ObjectId(scan_id)},
        {"$set": {"status": "processing"}},
    )

    try:
        # Fetch deps.dev info and download counts concurrently
        pkg_infos_task = depsdev.fetch_many(package_names, ecosystem)
        downloads_task = registries.fetch_download_counts(package_names, ecosystem)
        pkg_infos, download_counts = await asyncio.gather(pkg_infos_task, downloads_task)

        # Fetch GitHub data for every package that has a URL
        github_urls = [p.github_url for p in pkg_infos]
        repo_infos = await github.fetch_many(github_urls)

        # Lengths must match — fetch_many preserves input order
        if len(pkg_infos) != len(repo_infos):
            raise RuntimeError(
                f"Length mismatch: {len(pkg_infos)} pkg_infos vs {len(repo_infos)} repo_infos"
            )

        # Create the Scan node in AuraDB
        neo4j_scan_id = await graph_loader.create_scan_node(scan_id, user_email)

        # Collect all package names (direct + transitive deps)
        all_names: set[str] = set(package_names)
        for pi in pkg_infos:
            all_names.update(pi.deps)

        risk_labels: list[str] = []
        bus_factors: list[int] = []
        scorecard_scores: list[float] = []

        for pi, ri in zip(pkg_infos, repo_infos):
            bus_factor = max(ri.bus_factor, 1)
            score, label = compute_risk(
                bus_factor=bus_factor,
                inactivity_months=ri.inactivity_months,
                open_issues=ri.open_issues,
                scorecard_score=pi.scorecard_score,
            )
            risk_labels.append(label)
            bus_factors.append(bus_factor)
            scorecard_scores.append(pi.scorecard_score)

            node = graph_loader.PackageNode(
                name=pi.name,
                ecosystem=ecosystem,
                weekly_downloads=download_counts.get(pi.name, 0),
                bus_factor=bus_factor,
                risk_score=score,
                risk_label=label,
                dep_names=pi.deps,
                github_url=ri.url or pi.github_url,
                scorecard_score=pi.scorecard_score,
                stars=ri.stars or pi.stars,
                open_issues=ri.open_issues or pi.open_issues,
                last_commit_at=ri.last_commit_at,
                contributors=[
                    {
                        "login": c.login,
                        "commits_last_90d": c.commits_last_90d,
                        "last_commit_date": c.last_commit_date,
                    }
                    for c in ri.contributors
                ],
            )
            await graph_loader.upsert_package(node)

        # Write DEPENDS_ON edges (all package nodes already exist at this point)
        for pi in pkg_infos:
            for dep_name in pi.deps:
                await graph_loader.upsert_depends_on(pi.name, dep_name, ecosystem)

        # Link Scan node → Package nodes
        await graph_loader.link_scan_to_packages(
            neo4j_scan_id,
            list(all_names),
            set(package_names),
            ecosystem,
        )

        n = len(pkg_infos) or 1
        high = risk_labels.count("HIGH")
        med  = risk_labels.count("MEDIUM")
        low  = risk_labels.count("LOW")

        await col.update_one(
            {"_id": ObjectId(scan_id)},
            {
                "$set": {
                    "status": "completed",
                    "completed_at": datetime.now(timezone.utc),
                    "neo4j_scan_id": neo4j_scan_id,
                    "summary": {
                        "total_packages": len(pkg_infos),
                        "high_risk": high,
                        "medium_risk": med,
                        "low_risk": low,
                        "avg_bus_factor": round(sum(bus_factors) / n, 2),
                        "avg_scorecard":  round(sum(scorecard_scores) / n, 2),
                    },
                }
            },
        )

    except Exception as exc:
        logger.exception("Scan %s failed", scan_id)
        await col.update_one(
            {"_id": ObjectId(scan_id)},
            {"$set": {"status": "failed", "error": str(exc)}},
        )
