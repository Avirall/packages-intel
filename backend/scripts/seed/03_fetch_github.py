"""
Step 3 — Fetch GitHub contributor stats for each package that has a GitHub URL.

Reads:  scripts/seed/.cache/deps_info.json
        GITHUB_TOKEN from environment (or .env)
Writes: scripts/seed/.cache/github_info.json
  {"lodash": {"url": "...", "stars": 58000, "open_issues": 12,
              "last_commit_at": "2024-01-15T...",
              "contributors": [{"login": "jdalton", "commits_last_90d": 3, ...}]}, ...}

Usage:
  python scripts/seed/03_fetch_github.py
"""
import asyncio
import json
import os
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).parents[2] / ".env")

CACHE_DIR   = Path(__file__).parent / ".cache"
IN_FILE     = CACHE_DIR / "deps_info.json"
OUT_FILE    = CACHE_DIR / "github_info.json"

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
BASE         = "https://api.github.com"
CONCURRENCY  = 5
CUTOFF_DAYS  = 90


def _headers() -> dict:
    return {
        "Authorization":     f"Bearer {GITHUB_TOKEN}",
        "Accept":            "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


def _parse_github_url(url: str) -> tuple[str, str] | None:
    m = re.search(r"github\.com[/:]([^/]+)/([^/.\s]+)", url)
    if not m:
        return None
    return m.group(1), m.group(2).removesuffix(".git")


async def fetch_repo(
    client: httpx.AsyncClient,
    name: str,
    github_url: str,
    sem: asyncio.Semaphore,
) -> dict:
    parsed = _parse_github_url(github_url)
    if not parsed:
        return {"name": name, "url": github_url, "error": "unparseable URL"}

    owner, repo = parsed
    h = _headers()

    result: dict = {
        "name": name,
        "url": f"https://github.com/{owner}/{repo}",
        "stars": 0,
        "open_issues": 0,
        "last_commit_at": None,
        "contributors": [],
    }

    async with sem:
        # 1. Repo metadata
        try:
            r = await client.get(f"{BASE}/repos/{owner}/{repo}", headers=h, timeout=15)
            if r.status_code == 404:
                result["error"] = "not found"
                return result
            r.raise_for_status()
            data = r.json()
            result["stars"]       = data.get("stargazers_count", 0)
            result["open_issues"] = data.get("open_issues_count", 0)
        except Exception as e:
            result["error"] = str(e)
            return result

        # 2. Last commit
        try:
            r = await client.get(
                f"{BASE}/repos/{owner}/{repo}/commits",
                headers=h,
                params={"per_page": 1},
                timeout=15,
            )
            r.raise_for_status()
            commits = r.json()
            if commits and isinstance(commits, list):
                result["last_commit_at"] = (
                    commits[0].get("commit", {}).get("committer", {}).get("date")
                )
        except Exception:
            pass

        # 3. Contributors (last 90 days)
        try:
            since = (datetime.now(timezone.utc) - timedelta(days=CUTOFF_DAYS)).isoformat()
            r = await client.get(
                f"{BASE}/repos/{owner}/{repo}/commits",
                headers=h,
                params={"since": since, "per_page": 100},
                timeout=20,
            )
            r.raise_for_status()
            commits_data = r.json()

            counts: dict[str, dict] = {}
            if isinstance(commits_data, list):
                for c in commits_data:
                    login = (c.get("author") or {}).get("login")
                    if not login:
                        continue
                    if login not in counts:
                        counts[login] = {
                            "count": 0,
                            "last": c.get("commit", {}).get("committer", {}).get("date"),
                        }
                    counts[login]["count"] += 1

            result["contributors"] = [
                {"login": login, "commits_last_90d": v["count"], "last_commit_date": v["last"]}
                for login, v in counts.items()
            ]
        except Exception:
            pass

    return result


async def main() -> None:
    if not GITHUB_TOKEN:
        print("✗ GITHUB_TOKEN not set. Add it to backend/.env")
        sys.exit(1)

    if not IN_FILE.exists():
        print(f"✗ {IN_FILE} not found — run 02_fetch_deps.py first")
        sys.exit(1)

    deps_info: dict = json.loads(IN_FILE.read_text())

    # Only fetch packages that have a GitHub URL
    to_fetch = {
        name: info["github_url"]
        for name, info in deps_info.items()
        if info.get("github_url")
    }
    print(f"{len(to_fetch)}/{len(deps_info)} packages have a GitHub URL")

    # Resume from partial run
    existing: dict = {}
    if OUT_FILE.exists():
        existing = json.loads(OUT_FILE.read_text())
        to_fetch = {k: v for k, v in to_fetch.items() if k not in existing}
        print(f"  Resuming — {len(existing)} cached, {len(to_fetch)} remaining")

    sem  = asyncio.Semaphore(CONCURRENCY)
    done = 0

    async with httpx.AsyncClient() as client:
        async def _fetch(name: str, url: str) -> None:
            nonlocal done
            info = await fetch_repo(client, name, url, sem)
            existing[name] = info
            done += 1
            if done % 10 == 0:
                print(f"  {done}/{len(to_fetch)} ...", end="\r")
                OUT_FILE.write_text(json.dumps(existing, indent=2))

        await asyncio.gather(*[_fetch(n, u) for n, u in to_fetch.items()])

    OUT_FILE.write_text(json.dumps(existing, indent=2))
    print(f"\n✓ Saved GitHub info for {len(existing)} repos → {OUT_FILE}")
    errors = sum(1 for v in existing.values() if v.get("error"))
    with_contributors = sum(1 for v in existing.values() if v.get("contributors"))
    print(f"  {with_contributors} have active contributors | {errors} errors")


if __name__ == "__main__":
    asyncio.run(main())
