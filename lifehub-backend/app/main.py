"""FastAPI application entry point."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.base.api import auth, dashboard, sync, tags, users
from app.base.core.config import settings
from app.base.core.event_bus import event_bus
from app.base.core.plugin_loader import PluginLoader
from app.base.db.base_model import Base
from app.base.db.session import engine
from app.common.exceptions import register_exception_handlers

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("lifehub")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    app = FastAPI(
        title=settings.APP_NAME,
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # --- CORS ---
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # --- Register base routes ---
    app.include_router(auth.router)
    app.include_router(dashboard.router)
    app.include_router(users.router)
    app.include_router(tags.router)
    app.include_router(sync.router)

    # --- Register exception handlers ---
    register_exception_handlers(app)

    # --- Plugin loader ---
    plugin_loader = PluginLoader(app)
    plugin_loader.load_all(event_bus)

    return app, plugin_loader


app, plugin_loader = create_app()


@app.on_event("startup")
async def startup():
    """Startup: create tables if not exist + start event bus."""
    # Auto-create tables for development convenience
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables ensured")

    # Start event bus
    await event_bus.connect()
    await event_bus.start_listener()
    logger.info("EventBus started")


@app.on_event("shutdown")
async def shutdown():
    """Shutdown: disconnect event bus."""
    await event_bus.disconnect()


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    from app.common.response import success_response
    return success_response(data={"status": "ok", "version": "0.1.0"})
