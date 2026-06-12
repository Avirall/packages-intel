"""
Step 4 — Compute risk scores and load everything into AuraDB.

Reads:  scripts/seed/.cache/top_packages.json  (download counts)
        scripts/seed/.cache/deps_info.json      (dep trees, scorecard)
        scripts/seed/.cache/github_info.json    (contributors, last commit)
        NEO4J_URI / NEO4J_USER / NEO4J_PASSWORD from .env

Writes: nodes and relationships into AuraDB
  :Package, :Repository, :Contributor
  -[:DEPENDS_ON]-, -[:HOSTED_AT]-, -[:MAINTAINED_BY]-

Usage:
  python scripts/seed/04_load_graph.py [--dry-run]
"""
import argparse
import asyncio
import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parents[2] / ".env")

# Make app importable from scripts/
sys.path.insert(0, str(Path(__file__).parents[3]))

os.environ.setdefault("MONGODB_URL",          "mongodb://localhost")
os.environ.setdefault("AURA_CLIENT_ID",       "seed")
os.environ.setdefault("AURA_CLIENT_SECRET",   "seed")
os.environ.setdefault("AURA_AGENT_ENDPOINT",  "http://localhost")
os.environ.setdefault("GITHUB_TOKEN",         "seed")
os.environ.setdefault("SECRET_KEY",           "a" * 32)

CACHE_DIR = Path(__file__).parent / ".cache"


def _load_cache() -> tuple[dict, dict, dict]:
    pkgs_file   = CACHE_DIR / "top_packages.json"
    deps_file   = CACHE_DIR / "deps_info.json"
    github_file = CACHE_DIR / "github_info.json"

    for f in (pkgs_file, deps_file):
        if not f.exists():
            print(f"✗ {f} missing — run steps 01 and 02 first")
            sys.exit(1)

    packages = {p["name"]: p for p in json.loads(pkgs_file.read_text())}
    deps     = json.loads(deps_file.read_text())
    github   = json.loads(github_file.read_text()) if github_file.exists() else {}
    return packages, deps, github


async def load(dry_run: bool) -> None:
    from app.db.neo4j import create_indexes, run_query
    from app.services.risk import compute_risk
    from app.services.graph_loader import (
        PackageNode, upsert_package, upsert_depends_on,
    )

    packages, deps_info, github_info = _load_cache()

    if dry_run:
        print(f"[DRY RUN] Would load {len(packages)} packages — no writes performed")
        for name in list(packages.keys())[:5]:
            di = deps_info.get(name, {})
            gi = github_info.get(name, {})
            bus = len(gi.get("contributors", []))
            score, label = compute_risk(
                bus_factor=max(bus, 1),
                inactivity_months=_inactivity(gi),
                open_issues=gi.get("open_issues", 0),
                scorecard_score=di.get("scorecard_score", 0.0),
            )
            print(f"  {name}: score={score} label={label} bus={bus}")
        return

    # 1. Create Neo4j constraints
    print("Creating Neo4j constraints...")
    await create_indexes()
    print("✓ Constraints ready")

    # 2. Upsert all packages
    total   = len(packages)
    done    = 0
    skipped = 0

    print(f"Loading {total} packages into AuraDB...")
    for name, pkg_meta in packages.items():
        di = deps_info.get(name, {})
        gi = github_info.get(name, {})

        bus_factor = max(len(gi.get("contributors", [])), 1)
        inactivity = _inactivity(gi)
        score, label = compute_risk(
            bus_factor=bus_factor,
            inactivity_months=inactivity,
            open_issues=gi.get("open_issues", 0),
            scorecard_score=di.get("scorecard_score", 0.0),
        )

        node = PackageNode(
            name=name,
            ecosystem="npm",
            weekly_downloads=pkg_meta.get("weekly_downloads", 0),
            bus_factor=bus_factor,
            risk_score=score,
            risk_label=label,
            dep_names=di.get("deps", []),
            github_url=gi.get("url") or di.get("github_url", ""),
            scorecard_score=di.get("scorecard_score", 0.0),
            stars=gi.get("stars", 0) or di.get("stars", 0),
            open_issues=gi.get("open_issues", 0) or di.get("open_issues", 0),
            last_commit_at=gi.get("last_commit_at"),
            contributors=gi.get("contributors", []),
        )

        try:
            await upsert_package(node)
            done += 1
        except Exception as e:
            skipped += 1
            print(f"\n  warn: skipped {name}: {e}")

        if done % 25 == 0:
            print(f"  {done}/{total} upserted ...", end="\r")

    print(f"\n✓ {done} packages upserted ({skipped} skipped)")

    # 3. Write DEPENDS_ON edges
    print("Writing DEPENDS_ON relationships...")
    edge_count = 0
    for name, di in deps_info.items():
        for dep in di.get("deps", []):
            try:
                await upsert_depends_on(name, dep, "npm")
                edge_count += 1
            except Exception:
                pass

    print(f"✓ {edge_count} DEPENDS_ON relationships written")

    # 4. Summary stats
    rows = await run_query("MATCH (p:Package) RETURN count(p) AS n")
    pkg_count = rows[0]["n"] if rows else 0
    rows = await run_query("MATCH (c:Contributor) RETURN count(c) AS n")
    contrib_count = rows[0]["n"] if rows else 0
    rows = await run_query("MATCH (r:Repository) RETURN count(r) AS n")
    repo_count = rows[0]["n"] if rows else 0

    print(f"\n── AuraDB Summary ──────────────────────")
    print(f"  :Package      {pkg_count}")
    print(f"  :Repository   {repo_count}")
    print(f"  :Contributor  {contrib_count}")
    print(f"  DEPENDS_ON    {edge_count}")
    print(f"────────────────────────────────────────")


def _inactivity(gi: dict) -> float:
    last = gi.get("last_commit_at")
    if not last:
        return 999.0
    try:
        from datetime import datetime, timezone
        dt = datetime.fromisoformat(last.replace("Z", "+00:00"))
        return (datetime.now(timezone.utc) - dt).days / 30.0
    except Exception:
        return 999.0


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true",
                        help="Print what would be loaded without writing to AuraDB")
    args = parser.parse_args()
    asyncio.run(load(args.dry_run))
