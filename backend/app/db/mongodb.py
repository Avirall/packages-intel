import certifi
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongodb_url, tlsCAFile=certifi.where())
    return _client


def get_db() -> AsyncIOMotorDatabase:
    return get_client()[settings.mongodb_db_name]


async def close_client() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None


# ── Collection accessors ──────────────────────────────────────────────────────

def users_collection():
    return get_db()["users"]


def scans_collection():
    return get_db()["scans"]


def messages_collection():
    return get_db()["messages"]
