import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import settings
from app.db.mongodb import close_client, get_db
from app.db.neo4j import close_driver, create_indexes, get_driver
from app.api.routes import auth, chat, graph, history, scan

logging.basicConfig(
    level=logging.INFO if settings.is_production else logging.DEBUG,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up OSS Sentinel (%s)", settings.app_env)

    # MongoDB — create indexes (Motor create_index is a coroutine)
    db = get_db()
    await db["users"].create_index("email", unique=True)
    await db["users"].create_index("username", unique=True)
    await db["scans"].create_index([("user_id", 1), ("created_at", -1)])
    await db["messages"].create_index([("scan_id", 1), ("created_at", 1)])

    # Neo4j — warm up driver + create constraints
    get_driver()
    await create_indexes()

    logger.info("Startup complete")
    yield

    logger.info("Shutting down")
    await close_client()
    await close_driver()


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    openapi_url=None if settings.is_production else "/openapi.json",
)

# ── Middleware ────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if settings.is_production:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(scan.router)
app.include_router(history.router)
app.include_router(chat.router)
app.include_router(graph.router)


@app.get("/health", include_in_schema=False)
async def health():
    return {"status": "ok", "env": settings.app_env}
