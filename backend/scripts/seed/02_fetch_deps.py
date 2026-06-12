"""
Step 2 — Fetch dependency trees + OpenSSF Scorecard via deps.dev for each package.

Reads:  scripts/seed/.cache/top_packages.json
Writes: scripts/seed/.cache/deps_info.json
  {"lodash": {"latest_version": "4.17.21", "deps": [...], "scorecard_score": 7.2,
               "stars": 58000, "open_issues": 120, "github_url": "..."}, ...}

Usage:
  python scripts/seed/02_fetch_deps.py
"""
import asyncio
import json
import sys
from pathlib import Path

import httpx

CACHE_DIR  = Path(__file__).parent / ".cache"
IN_FILE    = CACHE_DIR / "top_packages.json"
OUT_FILE   = CACHE_DIR / "deps_info.json"

BASE       = "https://api.deps.dev/v3"
ECOSYSTEM  = "NPM"
CONCURRENCY = 8


def _encode(s: str) -> str:
    return s.replace("/", "%2F").replace("@", "%40")


def _is_prerelease(version: str) -> bool:
    return any(t in version.lower() for t in ("alpha", "beta", "rc", "pre", "dev", "snapshot"))


async def fetch_package_info(
    client: httpx.AsyncClient,
    name: str,
    sem: asyncio.Semaphore,
) -> dict:
    info: dict = {
        "name": name,
        "latest_version": "",
        "deps": [],
        "scorecard_score": 0.0,
        "stars": 0,
        "open_issues": 0,
        "github_url": "",
    }

    async with sem:
        # 1. Latest stable version
        try:
            r = await client.get(
                f"{BASE}/systems/{ECOSYSTEM}/packages/{_encode(name)}",
                timeout=15,
            )
            r.raise_for_status()
            versions = r.json().get("versions", [])
            stable = [v for v in versions
                      if not _is_prerelease(v.get("versionKey", {}).get("version", ""))]
            chosen = (stable or versions)[-1] if versions else None
            if not chosen:
                return info
            info["latest_version"] = chosen["versionKey"]["version"]
        except Exception as e:
            return info

        version = info["latest_version"]

        # 2. Direct dependencies
        try:
            r = await client.get(
                f"{BASE}/systems/{ECOSYSTEM}/packages/{_encode(name)}"
                f"/versions/{_encode(version)}/dependencies",
                timeout=15,
            )
            r.raise_for_status()
            nodes = r.json().get("nodes", [])
            info["deps"] = [
                n["versionKey"]["name"]
                for n in nodes
                if n.get("relation") == "DIRECT" and n["versionKey"]["name"] != name
            ]
        except Exception:
            pass

        # 3. Project metadata (github URL + Scorecard)
        try:
            r = await client.get(
                f"{BASE}/systems/{ECOSYSTEM}/packages/{_encode(name)}"
                f"/versions/{_encode(version)}",
                timeout=15,
            )
            r.raise_for_status()
            data = r.json()

            # GitHub URL from links
            for link in data.get("links", []):
                if "github.com" in link.get("url", ""):
                    info["github_url"] = link["url"]
                    break

            # Scorecard from project
            projects = data.get("projects", [])
            if projects:
                proj_id = projects[0].get("projectKey", {}).get("id", "")
                if proj_id:
                    pr = await client.get(
                        f"{BASE}/projects/{_encode(proj_id)}",
                        timeout=15,
                    )
                    pr.raise_for_status()
                    pdata = pr.json()
                    sc = pdata.get("scorecard", {})
                    info["scorecard_score"] = sc.get("overallScore", 0.0)
                    info["stars"]       = pdata.get("starsCount", 0)
                    info["open_issues"] = pdata.get("issuesCount", 0)
        except Exception:
            pass

    return info


async def main() -> None:
    if not IN_FILE.exists():
        print(f"✗ {IN_FILE} not found — run 01_fetch_top_packages.py first")
        sys.exit(1)

    packages = json.loads(IN_FILE.read_text())
    names = [p["name"] for p in packages]
    print(f"Fetching deps.dev info for {len(names)} packages (concurrency={CONCURRENCY})...")

    # Resume from partial run if cache exists
    existing: dict = {}
    if OUT_FILE.exists():
        existing = json.loads(OUT_FILE.read_text())
        remaining = [n for n in names if n not in existing]
        print(f"  Resuming — {len(existing)} already cached, {len(remaining)} to fetch")
        names = remaining

    sem = asyncio.Semaphore(CONCURRENCY)
    done = 0

    async with httpx.AsyncClient() as client:
        async def _fetch(name: str) -> None:
            nonlocal done
            info = await fetch_package_info(client, name, sem)
            existing[name] = info
            done += 1
            if done % 10 == 0:
                print(f"  {done}/{len(names)} ...", end="\r")
                OUT_FILE.write_text(json.dumps(existing, indent=2))  # incremental save

        await asyncio.gather(*[_fetch(n) for n in names])

    OUT_FILE.write_text(json.dumps(existing, indent=2))
    print(f"\n✓ Saved deps info for {len(existing)} packages → {OUT_FILE}")
    with_github = sum(1 for v in existing.values() if v.get("github_url"))
    print(f"  {with_github}/{len(existing)} packages have a GitHub URL")


if __name__ == "__main__":
    asyncio.run(main())
