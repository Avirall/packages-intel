"""
Writes package, repo, contributor, and scan nodes into AuraDB.
All writes use MERGE so the loader is idempotent (safe to re-run).
"""
import uuid
from dataclasses import dataclass, field

from app.db.neo4j import run_query
from app.services.risk import RiskLabel


@dataclass
class PackageNode:
    name: str
    ecosystem: str
    weekly_downloads: int = 0
    bus_factor: int = 0
    risk_score: float = 0.0
    risk_label: RiskLabel = "LOW"
    last_release_months_ago: float | None = None
    dep_names: list[str] = field(default_factory=list)
    github_url: str = ""
    scorecard_score: float = 0.0
    stars: int = 0
    open_issues: int = 0
    last_commit_at: str | None = None
    contributors: list[dict] = field(default_factory=list)


async def upsert_package(pkg: PackageNode) -> None:
    await run_query(
        """
        MERGE (p:Package {name: $name, ecosystem: $ecosystem})
        SET p.weekly_downloads       = $weekly_downloads,
            p.bus_factor             = $bus_factor,
            p.risk_score             = $risk_score,
            p.risk_label             = $risk_label,
            p.last_release_months_ago = $last_release_months_ago
        """,
        {
            "name":                   pkg.name,
            "ecosystem":              pkg.ecosystem,
            "weekly_downloads":       pkg.weekly_downloads,
            "bus_factor":             pkg.bus_factor,
            "risk_score":             pkg.risk_score,
            "risk_label":             pkg.risk_label,
            "last_release_months_ago": pkg.last_release_months_ago,
        },
    )

    if pkg.github_url:
        await run_query(
            """
            MERGE (r:Repository {url: $url})
            SET r.stars           = $stars,
                r.open_issues     = $open_issues,
                r.last_commit_at  = $last_commit_at,
                r.scorecard_score = $scorecard_score
            WITH r
            MATCH (p:Package {name: $name, ecosystem: $ecosystem})
            MERGE (p)-[:HOSTED_AT]->(r)
            """,
            {
                "url":             pkg.github_url,
                "stars":           pkg.stars,
                "open_issues":     pkg.open_issues,
                "last_commit_at":  pkg.last_commit_at,
                "scorecard_score": pkg.scorecard_score,
                "name":            pkg.name,
                "ecosystem":       pkg.ecosystem,
            },
        )

        for c in pkg.contributors:
            await run_query(
                """
                MERGE (c:Contributor {login: $login})
                SET c.commits_last_90d   = $commits,
                    c.last_commit_date   = $last_date,
                    c.is_sole_maintainer = $sole
                WITH c
                MATCH (r:Repository {url: $url})
                MERGE (r)-[rel:MAINTAINED_BY]->(c)
                SET rel.commits_last_90d = $commits
                """,
                {
                    "login":    c["login"],
                    "commits":  c["commits_last_90d"],
                    "last_date": c["last_commit_date"],
                    "sole":     len(pkg.contributors) == 1,
                    "url":      pkg.github_url,
                },
            )


async def upsert_depends_on(
    from_name: str, to_name: str, ecosystem: str, depth: int = 1
) -> None:
    # MERGE on both Package nodes so we never create a dangling edge.
    # The "to" package may not have been fetched (transitive dep beyond our scope),
    # so we ensure it exists with minimal properties.
    await run_query(
        """
        MERGE (a:Package {name: $from_name, ecosystem: $ecosystem})
        MERGE (b:Package {name: $to_name,   ecosystem: $ecosystem})
        MERGE (a)-[r:DEPENDS_ON]->(b)
        SET r.depth = $depth
        """,
        {
            "from_name": from_name,
            "to_name":   to_name,
            "ecosystem": ecosystem,
            "depth":     depth,
        },
    )


async def create_scan_node(mongo_scan_id: str, user_email: str) -> str:
    scan_neo4j_id = str(uuid.uuid4())
    await run_query(
        """
        MERGE (s:Scan {id: $id})
        SET s.mongo_scan_id = $mongo_id,
            s.user_email    = $user_email,
            s.created_at    = datetime()
        """,
        {
            "id":         scan_neo4j_id,
            "mongo_id":   mongo_scan_id,
            "user_email": user_email,
        },
    )
    return scan_neo4j_id


async def link_scan_to_packages(
    scan_neo4j_id: str,
    package_names: list[str],
    direct_names: set[str],
    ecosystem: str,
) -> None:
    for name in package_names:
        await run_query(
            """
            MATCH (s:Scan {id: $scan_id})
            MERGE (p:Package {name: $name, ecosystem: $ecosystem})
            MERGE (s)-[r:INCLUDES]->(p)
            SET r.is_direct = $is_direct
            """,
            {
                "scan_id":   scan_neo4j_id,
                "name":      name,
                "ecosystem": ecosystem,
                "is_direct": name in direct_names,
            },
        )
