import asyncio
from contextlib import asynccontextmanager
from datetime import datetime
import logging

from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware

from src.api.config import get_settings
from src.api.database import dispose_engine, init_db
from src.api.models.schemas import HealthResponse
from src.api.routes import (
    agents,
    deployments,
    webhooks,
    auth,
    clawhub,
    api_keys,
    newsletter,
    agent_runtime,
    ingest,
    leads,
)
from src.api.metrics import router as metrics_router, track_request
from src.api.services.monitor import start_background_monitor

settings = get_settings()

logging.basicConfig(
    level=settings.log_level,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def _initialize_database(app: FastAPI) -> None:
    await init_db()
    app.state.database_ready = True
    app.state.database_error = None
    app.state.database_error_detail = None
    logger.info("Database initialized")


async def _initialize_database_with_retries(app: FastAPI) -> None:
    retry_delay = settings.database_init_retry_interval_seconds

    while True:
        try:
            await _initialize_database(app)
            return
        except Exception as exc:
            app.state.database_ready = False
            app.state.database_error = "Database unavailable"
            app.state.database_error_detail = str(exc)
            logger.exception(
                "Database initialization failed; retrying in %s seconds",
                retry_delay,
            )
            await asyncio.sleep(retry_delay)


async def _start_monitor_when_database_ready(app: FastAPI) -> None:
    while not getattr(app.state, "database_ready", False):
        await asyncio.sleep(1)

    logger.info("Database ready; starting background monitor")
    await start_background_monitor()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up API...")
    app.state.database_ready = False
    app.state.database_error = None
    app.state.database_error_detail = None
    database_init_task: asyncio.Task[None] | None = None
    monitor_task: asyncio.Task[None] | None = None

    if settings.database_required_on_startup:
        await _initialize_database(app)
    else:
        logger.info("Database initialization running in background")
        database_init_task = asyncio.create_task(_initialize_database_with_retries(app))

    if settings.database_required_on_startup:
        monitor_task = asyncio.create_task(start_background_monitor())
    else:
        monitor_task = asyncio.create_task(_start_monitor_when_database_ready(app))

    try:
        yield
    finally:
        if monitor_task is not None:
            monitor_task.cancel()
            try:
                await monitor_task
            except asyncio.CancelledError:
                pass

        if database_init_task is not None:
            database_init_task.cancel()
            try:
                await database_init_task
            except asyncio.CancelledError:
                pass

        await dispose_engine()


app = FastAPI(
    title="mutx.dev API",
    description="API for the mutx platform",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add metrics middleware
app.middleware("http")(track_request)

# Include metrics router
app.include_router(metrics_router, tags=["monitoring"])

# Include API routers
app.include_router(agents.router, prefix="/api")
app.include_router(deployments.router, prefix="/api")
app.include_router(webhooks.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(clawhub.router, prefix="/api")
app.include_router(api_keys.router, prefix="/api")
app.include_router(newsletter.router, prefix="/api")
app.include_router(leads.router, prefix="/api")
app.include_router(agent_runtime.router, prefix="/api")
app.include_router(ingest.router, prefix="/api")


@app.get("/health", response_model=HealthResponse)
async def health_check(request: Request):
    database_ready = request.app.state.database_ready
    database_error = request.app.state.database_error

    return HealthResponse(
        status="healthy" if database_ready else "degraded",
        timestamp=datetime.utcnow(),
        database="ready" if database_ready else "unavailable" if database_error else "initializing",
        error=database_error,
    )


@app.get("/ready")
async def readiness_check(request: Request, response: Response):
    database_ready = request.app.state.database_ready
    database_error = request.app.state.database_error
    database_status = (
        "ready" if database_ready else "unavailable" if database_error else "initializing"
    )

    if not database_ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "ready" if database_ready else "not_ready",
        "timestamp": datetime.utcnow(),
        "database": database_status,
        "error": database_error,
    }


@app.get("/")
async def root():
    return {"message": "mutx.dev API", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.api.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True,
    )
