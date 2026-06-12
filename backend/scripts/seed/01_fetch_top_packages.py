"""
Step 1 — Fetch the top N npm packages by weekly downloads.

Writes: scripts/seed/.cache/top_packages.json
  [{"name": "lodash", "weekly_downloads": 45000000}, ...]

Usage:
  python scripts/seed/01_fetch_top_packages.py [--count 300]
"""
import argparse
import asyncio
import json
import sys
from pathlib import Path

import httpx

CACHE_DIR = Path(__file__).parent / ".cache"
OUT_FILE   = CACHE_DIR / "top_packages.json"

# npm's public list of most-depended-upon packages
NPM_POPULAR_URL = "https://registry.npmjs.com/-/v1/search"


async def fetch_top_packages(count: int) -> list[dict]:
    packages: list[dict] = []
    page_size = 250  # npm API max

    async with httpx.AsyncClient(timeout=30) as client:
        offset = 0
        while len(packages) < count:
            params = {
                "text":    "not:unstable not:insecure",
                "size":    min(page_size, count - len(packages)),
                "from":    offset,
                "ranking": "popularity",
            }
            r = await client.get(NPM_POPULAR_URL, params=params)
            r.raise_for_status()
            data = r.json()
            objects = data.get("objects", [])
            if not objects:
                break

            for obj in objects:
                pkg = obj.get("package", {})
                name = pkg.get("name", "")
                if name:
                    packages.append({
                        "name": name,
                        "description": pkg.get("description", ""),
                        "version": pkg.get("version", ""),
                    })

            offset += len(objects)
            print(f"  fetched {len(packages)}/{count} ...", end="\r")

            if len(objects) < page_size:
                break  # no more pages

    print()
    return packages[:count]


async def fetch_download_counts(packages: list[dict]) -> list[dict]:
    """Enrich each package with its actual weekly download count."""
    sem = asyncio.Semaphore(20)
    results: list[dict] = []

    async def _fetch(client: httpx.AsyncClient, pkg: dict) -> dict:
        async with sem:
            try:
                r = await client.get(
                    f"https://api.npmjs.org/downloads/point/last-week/{pkg['name']}",
                    timeout=10,
                )
                r.raise_for_status()
                pkg["weekly_downloads"] = r.json().get("downloads", 0)
            except Exception as e:
                print(f"\n  warn: download count failed for {pkg['name']}: {e}")
                pkg["weekly_downloads"] = 0
            return pkg

    async with httpx.AsyncClient() as client:
        enriched = await asyncio.gather(*[_fetch(client, p) for p in packages])

    return sorted(enriched, key=lambda x: x["weekly_downloads"], reverse=True)


async def main(count: int) -> None:
    CACHE_DIR.mkdir(exist_ok=True)

    print(f"Fetching top {count} npm packages by popularity...")
    packages = await fetch_top_packages(count)
    print(f"Found {len(packages)} packages. Fetching download counts...")
    packages = await fetch_download_counts(packages)

    OUT_FILE.write_text(json.dumps(packages, indent=2))
    print(f"✓ Saved {len(packages)} packages → {OUT_FILE}")
    print(f"  Top 5: {[p['name'] for p in packages[:5]]}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=300,
                        help="Number of packages to fetch (default: 300)")
    args = parser.parse_args()
    asyncio.run(main(args.count))
