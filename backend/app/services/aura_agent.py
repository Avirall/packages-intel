import asyncio
import logging
import time

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

_TOKEN_URL = "https://api.neo4j.io/v2beta1/oauth/token"

# Token state — protected by an asyncio lock to prevent concurrent refreshes
_token: str | None = None
_token_expires_at: float = 0.0
_token_lock = asyncio.Lock()


async def _get_bearer_token() -> str:
    global _token, _token_expires_at

    # Fast path: token still valid (with 30-second safety margin)
    if _token and time.monotonic() < _token_expires_at - 30:
        return _token

    async with _token_lock:
        # Re-check inside the lock (another coroutine may have refreshed)
        if _token and time.monotonic() < _token_expires_at - 30:
            return _token

        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                _TOKEN_URL,
                data={
                    "grant_type":    "client_credentials",
                    "client_id":     settings.aura_client_id,
                    "client_secret": settings.aura_client_secret,
                },
            )
            r.raise_for_status()
            data = r.json()

        _token = data["access_token"]
        _token_expires_at = time.monotonic() + data.get("expires_in", 3600)
        logger.debug("Aura Agent token refreshed")
        return _token


async def query_agent(question: str) -> str:
    token = await _get_bearer_token()
    async with httpx.AsyncClient(timeout=45) as client:
        r = await client.post(
            settings.aura_agent_endpoint,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type":  "application/json",
            },
            json={"input": question},
        )
        r.raise_for_status()
        data = r.json()
        # v2beta1 returns content as a list of typed blocks
        content = data.get("content", [])
        if isinstance(content, list):
            text_parts = [c["text"] for c in content if c.get("type") == "text"]
            return "\n\n".join(text_parts) if text_parts else "No response from agent."
        return data.get("output", str(content) or "No response from agent.")
