import asyncio
import logging

import httpx

logger = logging.getLogger(__name__)


async def _npm_downloads(client: httpx.AsyncClient, name: str, sem: asyncio.Semaphore) -> int:
    async with sem:
        try:
            r = await client.get(
                f"https://api.npmjs.org/downloads/point/last-week/{name}",
                timeout=10,
            )
            r.raise_for_status()
            return int(r.json().get("downloads", 0))
        except Exception:
            logger.debug("npm downloads failed for %s", name, exc_info=True)
            return 0


async def _pypi_downloads(client: httpx.AsyncClient, name: str, sem: asyncio.Semaphore) -> int:
    async with sem:
        try:
            r = await client.get(
                f"https://pypistats.org/api/packages/{name.lower()}/recent",
                timeout=10,
            )
            r.raise_for_status()
            return int(r.json().get("data", {}).get("last_week", 0))
        except Exception:
            logger.debug("PyPI downloads failed for %s", name, exc_info=True)
            return 0


async def fetch_download_counts(
    names: list[str],
    ecosystem: str,
    concurrency: int = 10,
) -> dict[str, int]:
    if not names:
        return {}

    sem = asyncio.Semaphore(concurrency)
    async with httpx.AsyncClient() as client:
        if ecosystem == "npm":
            results = await asyncio.gather(
                *[_npm_downloads(client, n, sem) for n in names]
            )
        elif ecosystem == "python":
            results = await asyncio.gather(
                *[_pypi_downloads(client, n, sem) for n in names]
            )
        else:
            return {n: 0 for n in names}

    return dict(zip(names, results))
