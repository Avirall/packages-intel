import asyncio
import logging
from dataclasses import dataclass, field

import httpx

logger = logging.getLogger(__name__)

_BASE = "https://api.deps.dev/v3"

# deps.dev ecosystem identifiers
_ECOSYSTEM_MAP = {
    "npm":    "NPM",
    "python": "PYPI",
    "go":     "GO",
    "rust":   "CARGO",
    "java":   "MAVEN",
    "ruby":   "RUBYGEMS",
    "php":    "PACKAGIST",
}


@dataclass
class PackageInfo:
    name: str
    ecosystem: str
    latest_version: str = ""
    deps: list[str] = field(default_factory=list)      # direct dep names
    scorecard_score: float = 0.0
    stars: int = 0
    open_issues: int = 0
    github_url: str = ""


async def fetch_package_info(
    client: httpx.AsyncClient,
    name: str,
    ecosystem: str,
) -> PackageInfo:
    system = _ECOSYSTEM_MAP.get(ecosystem, "NPM")
    info = PackageInfo(name=name, ecosystem=ecosystem)

    # 1. get latest version
    try:
        r = await client.get(f"{_BASE}/systems/{system}/packages/{_encode(name)}")
        r.raise_for_status()
        versions: list[dict] = r.json().get("versions", [])
        # pick the most recent non-prerelease version
        stable = [v for v in versions if not _is_prerelease(v.get("versionKey", {}).get("version", ""))]
        chosen = (stable or versions)[-1] if versions else None
        if chosen:
            info.latest_version = chosen["versionKey"]["version"]
    except Exception as exc:
        logger.debug("deps.dev version lookup failed for %s: %s", name, exc)
        return info

    # 2. get direct dependencies
    try:
        r = await client.get(
            f"{_BASE}/systems/{system}/packages/{_encode(name)}"
            f"/versions/{_encode(info.latest_version)}/dependencies"
        )
        r.raise_for_status()
        nodes = r.json().get("nodes", [])
        info.deps = [
            n["versionKey"]["name"]
            for n in nodes
            if n.get("relation") == "DIRECT"
            and n["versionKey"]["name"] != name
        ]
    except Exception as exc:
        logger.debug("deps.dev deps lookup failed for %s: %s", name, exc)

    # 3. get project metadata (scorecard, github url)
    try:
        r = await client.get(
            f"{_BASE}/systems/{system}/packages/{_encode(name)}"
            f"/versions/{_encode(info.latest_version)}"
        )
        r.raise_for_status()
        links = r.json().get("links", [])
        for link in links:
            if "github.com" in link.get("url", ""):
                info.github_url = link["url"]
                break
        # OpenSSF Scorecard
        proj_links = r.json().get("projects", [])
        if proj_links:
            proj_key = proj_links[0].get("projectKey", {})
            proj_id = proj_key.get("id", "")
            if proj_id:
                pr = await client.get(f"{_BASE}/projects/{_encode(proj_id)}")
                pr.raise_for_status()
                sc = pr.json().get("scorecard", {})
                info.scorecard_score = sc.get("overallScore", 0.0)
                info.stars = pr.json().get("starsCount", 0)
                info.open_issues = pr.json().get("issuesCount", 0)
    except Exception as exc:
        logger.debug("deps.dev project lookup failed for %s: %s", name, exc)

    return info


async def fetch_many(
    names: list[str],
    ecosystem: str,
    concurrency: int = 8,
) -> list[PackageInfo]:
    sem = asyncio.Semaphore(concurrency)
    async with httpx.AsyncClient(timeout=15) as client:
        async def _fetch(name: str) -> PackageInfo:
            async with sem:
                return await fetch_package_info(client, name, ecosystem)

        return await asyncio.gather(*[_fetch(n) for n in names])


# ── helpers ───────────────────────────────────────────────────────────────────

def _encode(s: str) -> str:
    return s.replace("/", "%2F").replace("@", "%40")


def _is_prerelease(version: str) -> bool:
    return any(tag in version.lower() for tag in ("alpha", "beta", "rc", "pre", "dev", "snapshot"))
