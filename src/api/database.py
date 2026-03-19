from dataclasses import dataclass
import logging
from typing import Any

from sqlalchemy import inspect, text
from sqlalchemy.engine import Connection, make_url
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from src.api.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)
runtime_ssl_mode_override: str | None = None

SSL_REJECTION_ERROR_FRAGMENTS = (
    "rejected ssl upgrade",
    "server does not support ssl",
    "ssl is not enabled on the server",
)


@dataclass
class EngineConfig:
    url: str
    connect_args: dict[str, Any]
    ssl_mode_explicitly_set: bool


def _normalize_ssl_setting(value: str) -> str | bool:
    lowered_value = value.strip().lower()

    if lowered_value in {"1", "true", "yes", "on"}:
        return "require"

    if lowered_value in {"0", "false", "no", "off", "disable"}:
        return False

    if lowered_value in {"allow", "prefer", "require", "verify-ca", "verify-full"}:
        return lowered_value

    raise ValueError(
        "Unsupported PostgreSQL SSL mode. Use one of: disable, allow, prefer, require, verify-ca, verify-full."
    )


def _build_engine_config(database_url: str, override_ssl_mode: str | None = None) -> EngineConfig:
    url = make_url(database_url)
    base_drivername = url.drivername.split("+", 1)[0]

    # Allow SQLite for testing
    if base_drivername in {"sqlite"}:
        return EngineConfig(
            url=database_url,
            connect_args={"check_same_thread": False},
            ssl_mode_explicitly_set=False,
        )

    if base_drivername not in {"postgres", "postgresql"}:
        raise ValueError("DATABASE_URL must use a PostgreSQL or SQLite scheme")

    query = dict(url.query)
    connect_args: dict[str, Any] = {
        "timeout": settings.database_connect_timeout_seconds,
        "statement_cache_size": 0,
    }

    url_ssl_setting = query.pop("sslmode", None) or query.pop("ssl", None)
    ssl_setting = override_ssl_mode or settings.database_ssl_mode or url_ssl_setting
    if ssl_setting:
        connect_args["ssl"] = _normalize_ssl_setting(ssl_setting)

    query.setdefault("prepared_statement_cache_size", "0")

    asyncpg_url = url.set(drivername="postgresql+asyncpg", query=query)
    return EngineConfig(
        url=asyncpg_url.render_as_string(hide_password=False),
        connect_args=connect_args,
        ssl_mode_explicitly_set=ssl_setting is not None,
    )


def build_sync_database_url(database_url: str) -> str:
    url = make_url(database_url)
    base_drivername = url.drivername.split("+", 1)[0]
    query = dict(url.query)

    url_ssl_setting = query.pop("sslmode", None) or query.pop("ssl", None)
    ssl_setting = runtime_ssl_mode_override or settings.database_ssl_mode or url_ssl_setting

    if ssl_setting:
        normalized_ssl_setting = _normalize_ssl_setting(ssl_setting)
        query["sslmode"] = (
            normalized_ssl_setting if isinstance(normalized_ssl_setting, str) else "disable"
        )

    if base_drivername == "postgres":
        return url.set(drivername="postgresql", query=query).render_as_string(hide_password=False)

    if base_drivername == "postgresql":
        return url.set(drivername="postgresql", query=query).render_as_string(hide_password=False)

    return database_url


def _create_engine(engine_config: EngineConfig) -> AsyncEngine:
    engine_kwargs: dict[str, Any] = {
        "echo": False,
        "pool_pre_ping": True,
        "connect_args": engine_config.connect_args,
    }

    if engine_config.url.startswith("postgresql+"):
        engine_kwargs["poolclass"] = NullPool

    return create_async_engine(
        engine_config.url,
        **engine_kwargs,
    )


engine_config = _build_engine_config(settings.database_url)
engine = _create_engine(engine_config)
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def _reconfigure_engine(override_ssl_mode: str | None = None) -> None:
    global engine, async_session_maker, engine_config, runtime_ssl_mode_override

    await engine.dispose()
    runtime_ssl_mode_override = override_ssl_mode
    engine_config = _build_engine_config(settings.database_url, override_ssl_mode=override_ssl_mode)
    engine = _create_engine(engine_config)
    async_session_maker = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )


def _should_retry_without_ssl(exc: Exception) -> bool:
    if engine_config.ssl_mode_explicitly_set:
        return False

    error_message = str(exc).lower()
    return any(fragment in error_message for fragment in SSL_REJECTION_ERROR_FRAGMENTS)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def _run_startup_probe() -> None:
    async with engine.begin() as conn:
        await conn.execute(text("SELECT 1"))


def _has_table(sync_connection: Connection, table_name: str) -> bool:
    return inspect(sync_connection).has_table(table_name)


def _has_column(sync_connection: Connection, table_name: str, column_name: str) -> bool:
    inspector = inspect(sync_connection)
    if not inspector.has_table(table_name):
        return False
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def _has_index(sync_connection: Connection, table_name: str, index_name: str) -> bool:
    inspector = inspect(sync_connection)
    if not inspector.has_table(table_name):
        return False
    return any(index["name"] == index_name for index in inspector.get_indexes(table_name))


def _repair_known_schema_drift(sync_connection: Connection) -> list[str]:
    from src.api.models.models import AgentLog, RefreshTokenSession, UsageEvent

    repaired_objects: list[str] = []

    if not _has_table(sync_connection, AgentLog.__tablename__):
        AgentLog.__table__.create(bind=sync_connection, checkfirst=True)
        repaired_objects.append(AgentLog.__tablename__)
    elif not _has_column(sync_connection, AgentLog.__tablename__, "meta_data"):
        sync_connection.execute(text("ALTER TABLE agent_logs ADD COLUMN meta_data TEXT"))
        repaired_objects.append("agent_logs.meta_data")

    if not _has_table(sync_connection, RefreshTokenSession.__tablename__):
        RefreshTokenSession.__table__.create(bind=sync_connection, checkfirst=True)
        repaired_objects.append(RefreshTokenSession.__tablename__)
    else:
        for index in sorted(RefreshTokenSession.__table__.indexes, key=lambda item: item.name or ""):
            if index.name and not _has_index(
                sync_connection,
                RefreshTokenSession.__tablename__,
                index.name,
            ):
                index.create(bind=sync_connection, checkfirst=True)
                repaired_objects.append(f"{RefreshTokenSession.__tablename__}.{index.name}")

    if not _has_table(sync_connection, UsageEvent.__tablename__):
        UsageEvent.__table__.create(bind=sync_connection, checkfirst=True)
        repaired_objects.append(UsageEvent.__tablename__)
    else:
        usage_event_column_repairs = {
            "resource_type": "ALTER TABLE usage_events ADD COLUMN resource_type VARCHAR(100)",
            "resource_id": "ALTER TABLE usage_events ADD COLUMN resource_id VARCHAR(255)",
            "credits_used": (
                "ALTER TABLE usage_events "
                "ADD COLUMN credits_used DOUBLE PRECISION NOT NULL DEFAULT 1.0"
            ),
            "event_metadata": "ALTER TABLE usage_events ADD COLUMN event_metadata TEXT",
        }

        for column_name, statement in usage_event_column_repairs.items():
            if not _has_column(sync_connection, UsageEvent.__tablename__, column_name):
                sync_connection.execute(text(statement))
                repaired_objects.append(f"{UsageEvent.__tablename__}.{column_name}")

        for index in sorted(UsageEvent.__table__.indexes, key=lambda item: item.name or ""):
            if index.name and not _has_index(
                sync_connection,
                UsageEvent.__tablename__,
                index.name,
            ):
                index.create(bind=sync_connection, checkfirst=True)
                repaired_objects.append(f"{UsageEvent.__tablename__}.{index.name}")

    return repaired_objects


async def _repair_runtime_schema() -> None:
    async with engine.begin() as conn:
        repaired_objects = await conn.run_sync(_repair_known_schema_drift)

    if repaired_objects:
        logger.warning(
            "Applied runtime database schema repairs: %s",
            ", ".join(repaired_objects),
        )


async def init_db() -> None:
    try:
        await _run_startup_probe()
        await _repair_runtime_schema()
    except Exception as exc:
        if not _should_retry_without_ssl(exc):
            raise

        logger.warning("Database rejected SSL upgrade; retrying with SSL disabled for asyncpg")
        await _reconfigure_engine(override_ssl_mode="disable")
        await _run_startup_probe()
        await _repair_runtime_schema()


async def dispose_engine() -> None:
    await engine.dispose()
