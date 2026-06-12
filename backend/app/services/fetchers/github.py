import asyncio
import logging
import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

_BASE = "https://api.github.com"
_CUTOFF_DAYS = 90


@dataclass
class ContributorInfo:
    login: str
    commits_last_90d: int
    last_commit_date: str | None


@dataclass
class RepoInfo:
    url: str = ""
    stars: int = 0
    open_issues: int = 0
    last_commit_at: str | None = None
    contributors: list[ContributorInfo] = field(default_factory=list)

    @property
    def bus_factor(self) -> int:
        return len(self.contributors)

    @property
    def inactivity_months(self) -> float:
        if not self.last_commit_at:
            return 999.0
        try:
            last = datetime.fromisoformat(self.last_commit_at.replace("Z", "+00:00"))
            delta = datetime.now(timezone.utc) - last
            return delta.days / 30.0
        except Exception:
            return 999.0


def _parse_github_url(url: str) -> tuple[str, str] | None:
    m = re.search(r"github\.com[/:]([^/]+)/([^/.\s]+)", url)
    if not m:
        return None
    return m.group(1), m.group(2).removesuffix(".git")


def _github_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.github_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }


async def fetch_repo_info(
    client: httpx.AsyncClient,
    github_url: str,
    sem: asyncio.Semaphore,
) -> RepoInfo:
    parsed = _parse_github_url(github_url)
    if not parsed:
        return RepoInfo(url=github_url)

    owner, repo = parsed
    headers = _github_headers()
    info = RepoInfo(url=f"https://github.com/{owner}/{repo}")

    async with sem:
        # 1. repo metadata
        try:
            r = await client.get(f"{_BASE}/repos/{owner}/{repo}", headers=headers)
            r.raise_for_status()
            data = r.json()
            info.stars = data.get("stargazers_count", 0)
            info.open_issues = data.get("open_issues_count", 0)
        except Exception:
            logger.debug("GitHub repo fetch failed %s/%s", owner, repo, exc_info=True)
            return info

        # 2. last commit date
        try:
            r = await client.get(
                f"{_BASE}/repos/{owner}/{repo}/commits",
                headers=headers,
                params={"per_page": 1},
            )
            r.raise_for_status()
            commits = r.json()
            if commits and isinstance(commits, list):
                info.last_commit_at = (
                    commits[0].get("commit", {}).get("committer", {}).get("date")
                )
        except Exception:
            logger.debug("GitHub last-commit fetch failed %s/%s", owner, repo, exc_info=True)

        # 3. contributors active in the last 90 days
        try:
            # Use timedelta — never touch .day directly for date arithmetic
            since = (datetime.now(timezone.utc) - timedelta(days=_CUTOFF_DAYS)).isoformat()

            r = await client.get(
                f"{_BASE}/repos/{owner}/{repo}/commits",
                headers=headers,
                params={"since": since, "per_page": 100},
            )
            r.raise_for_status()
            commits_data = r.json()

            counts: dict[str, dict] = {}
            if isinstance(commits_data, list):
                for c in commits_data:
                    author = c.get("author") or {}
                    login = author.get("login")
                    if not login:
                        continue
                    if login not in counts:
                        counts[login] = {
                            "count": 0,
                            "last": c.get("commit", {}).get("committer", {}).get("date"),
                        }
                    counts[login]["count"] += 1

            info.contributors = [
                ContributorInfo(
                    login=login,
                    commits_last_90d=v["count"],
                    last_commit_date=v["last"],
                )
                for login, v in counts.items()
            ]
        except Exception:
            logger.debug("GitHub contributors fetch failed %s/%s", owner, repo, exc_info=True)

    return info


async def fetch_many(
    github_urls: list[str],
    concurrency: int = 5,
) -> list[RepoInfo]:
    sem = asyncio.Semaphore(concurrency)
    async with httpx.AsyncClient(timeout=20) as client:
        return list(
            await asyncio.gather(
                *[fetch_repo_info(client, url, sem) for url in github_urls]
            )
        )
