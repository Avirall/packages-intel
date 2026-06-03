from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.mongodb import close_client, get_db
from app.db.neo4j import close_driver, get_driver
from app.api.routes import auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup: initialise connections
    get_db()
    get_driver()

    # create MongoDB indexes on first run
    await get_db()["users"].create_index("email", unique=True)
    await get_db()["users"].create_index("username", unique=True)
    await get_db()["scans"].create_index("user_id")
    await get_db()["messages"].create_index("scan_id")

    yield

    # shutdown: close connections
    await close_client()
    await close_driver()


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
# scan, history, chat, graph routers will be added as they are implemented


@app.get("/health")
async def health():
    return {"status": "ok", "env": settings.app_env}
