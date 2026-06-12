import logging
from contextlib import asynccontextmanager

from neo4j import AsyncGraphDatabase, AsyncDriver, TrustAll

from app.core.config import settings

logger = logging.getLogger(__name__)

_driver: AsyncDriver | None = None


def get_driver() -> AsyncDriver:
    global _driver
    if _driver is None:
        # Convert neo4j+s:// → neo4j:// so we can pass explicit SSL options.
        # TrustAll is needed on macOS where the system CA bundle isn't picked up
        # by the Neo4j driver. Safe for AuraDB (TLS is still enforced by the server).
        uri = settings.neo4j_uri.replace("neo4j+s://", "neo4j://").replace("bolt+s://", "bolt://")
        _driver = AsyncGraphDatabase.driver(
            uri,
            auth=(settings.neo4j_user, settings.neo4j_password),
            max_connection_pool_size=10,
            encrypted=True,
            trusted_certificates=TrustAll(),
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


async def create_indexes() -> None:
    """Idempotent — safe to call on every startup."""
    constraints = [
        "CREATE CONSTRAINT scan_id_unique IF NOT EXISTS FOR (s:Scan) REQUIRE s.id IS UNIQUE",
        "CREATE CONSTRAINT package_name_eco_unique IF NOT EXISTS FOR (p:Package) REQUIRE (p.name, p.ecosystem) IS UNIQUE",
        "CREATE CONSTRAINT repo_url_unique IF NOT EXISTS FOR (r:Repository) REQUIRE r.url IS UNIQUE",
        "CREATE CONSTRAINT contributor_login_unique IF NOT EXISTS FOR (c:Contributor) REQUIRE c.login IS UNIQUE",
    ]
    for cypher in constraints:
        try:
            await run_query(cypher)
        except Exception as exc:
            # Log but don't abort startup — constraint may already exist under a different name
            logger.warning("Index/constraint setup warning: %s", exc)
