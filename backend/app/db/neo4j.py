from contextlib import asynccontextmanager

from neo4j import AsyncGraphDatabase, AsyncDriver

from app.core.config import settings

_driver: AsyncDriver | None = None


def get_driver() -> AsyncDriver:
    global _driver
    if _driver is None:
        _driver = AsyncGraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_user, settings.neo4j_password),
        )
    return _driver


async def close_driver() -> None:
    global _driver
    if _driver is not None:
        await _driver.close()
        _driver = None


@asynccontextmanager
async def get_session():
    async with get_driver().session() as session:
        yield session


async def run_query(cypher: str, params: dict | None = None) -> list[dict]:
    async with get_session() as session:
        result = await session.run(cypher, params or {})
        return [record.data() async for record in result]
