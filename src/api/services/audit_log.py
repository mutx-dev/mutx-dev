"""
Audit Logging Service.

Provides structured audit logging for agent operations including
AGENT_START, LLM_CALL, TOOL_CALL, POLICY_CHECK, GUARDRAIL_TRIGGER, and AGENT_END events.
Integrates with OpenTelemetry spans for automatic trace_id and span_id capture.
"""

import asyncio
import hashlib
import json
import logging
import uuid
from datetime import datetime
from enum import Enum
from typing import Any

import aiosqlite

logger = logging.getLogger(__name__)


def _get_otel_trace_context() -> tuple[str | None, str | None]:
    """Extract trace_id and span_id from the current OTel span context.

    Returns:
        Tuple of (trace_id, span_id) from the active span, or (None, None) if no span.
    """
    try:
        from opentelemetry import trace

        span = trace.get_current_span()
        if span is None:
            return None, None

        ctx = span.get_span_context()
        if ctx is None or not ctx.is_valid:
            return None, None

        trace_id = format(ctx.trace_id, "032x")
        span_id = format(ctx.span_id, "016x")
        return trace_id, span_id
    except Exception:
        # OTel may not be installed or configured
        return None, None


DATABASE_PATH = "audit.db"
AUDIT_TABLE_SCHEMA = """
CREATE TABLE IF NOT EXISTS audit_events (
    event_id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    run_id TEXT,
    span_id TEXT,
    parent_span_id TEXT,
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    trace_id TEXT,
    actor_type TEXT NOT NULL DEFAULT 'agent',
    actor_id TEXT,
    actor_display TEXT,
    policy_decision_id TEXT,
    policy_refs TEXT NOT NULL DEFAULT '[]',
    approval_id TEXT,
    cost_record TEXT,
    redaction_status TEXT NOT NULL DEFAULT 'none',
    schema_version TEXT NOT NULL DEFAULT '1.0',
    previous_hash TEXT,
    integrity_hash TEXT
)
"""
AUDIT_TABLE_INDEXES = [
    "CREATE INDEX IF NOT EXISTS idx_audit_agent_id ON audit_events(agent_id)",
    "CREATE INDEX IF NOT EXISTS idx_audit_session_id ON audit_events(session_id)",
    "CREATE INDEX IF NOT EXISTS idx_audit_trace_id ON audit_events(trace_id)",
    "CREATE INDEX IF NOT EXISTS idx_audit_run_id ON audit_events(run_id)",
    "CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events(timestamp)",
    "CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_events(event_type)",
    """
    CREATE INDEX IF NOT EXISTS idx_audit_missing_integrity_hash
    ON audit_events(event_id)
    WHERE integrity_hash IS NULL OR integrity_hash = ''
    """,
]

AUDIT_COLUMN_MIGRATIONS = {
    "run_id": "TEXT",
    "parent_span_id": "TEXT",
    "actor_type": "TEXT NOT NULL DEFAULT 'agent'",
    "actor_id": "TEXT",
    "actor_display": "TEXT",
    "policy_decision_id": "TEXT",
    "policy_refs": "TEXT NOT NULL DEFAULT '[]'",
    "approval_id": "TEXT",
    "cost_record": "TEXT",
    "redaction_status": "TEXT NOT NULL DEFAULT 'none'",
    "schema_version": "TEXT NOT NULL DEFAULT '1.0'",
    "previous_hash": "TEXT",
    "integrity_hash": "TEXT",
}

AUDIT_SELECT_COLUMNS = """
event_id, agent_id, session_id, run_id, span_id, parent_span_id,
event_type, payload, timestamp, trace_id, actor_type, actor_id,
actor_display, policy_decision_id, policy_refs, approval_id, cost_record,
redaction_status, schema_version, previous_hash, integrity_hash
""".strip()


class AuditEventType(str, Enum):
    """Types of audit events that can be logged."""

    AGENT_START = "AGENT_START"
    LLM_CALL = "LLM_CALL"
    TOOL_CALL = "TOOL_CALL"
    POLICY_CHECK = "POLICY_CHECK"
    GUARDRAIL_TRIGGER = "GUARDRAIL_TRIGGER"
    AGENT_END = "AGENT_END"


class AuditEvent:
    """Model for an audit event."""

    def __init__(
        self,
        event_id: uuid.UUID,
        agent_id: str,
        session_id: str,
        event_type: AuditEventType,
        payload: dict[str, Any],
        timestamp: datetime,
        run_id: str | None = None,
        span_id: str | None = None,
        parent_span_id: str | None = None,
        trace_id: str | None = None,
        actor_type: str = "agent",
        actor_id: str | None = None,
        actor_display: str | None = None,
        policy_decision_id: str | None = None,
        policy_refs: list[str] | None = None,
        approval_id: str | None = None,
        cost_record: dict[str, Any] | None = None,
        redaction_status: str = "none",
        schema_version: str = "1.0",
        previous_hash: str | None = None,
        integrity_hash: str | None = None,
    ):
        self.event_id = event_id
        self.agent_id = agent_id
        self.session_id = session_id
        self.run_id = run_id
        self.span_id = span_id
        self.parent_span_id = parent_span_id
        self.event_type = event_type
        self.payload = payload
        self.timestamp = timestamp
        self.trace_id = trace_id
        self.actor_type = actor_type
        self.actor_id = actor_id or agent_id
        self.actor_display = actor_display
        self.policy_decision_id = policy_decision_id
        self.policy_refs = policy_refs or []
        self.approval_id = approval_id
        self.cost_record = cost_record
        self.redaction_status = redaction_status
        self.schema_version = schema_version
        self.previous_hash = previous_hash
        self.integrity_hash = integrity_hash

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "event_id": str(self.event_id),
            "agent_id": self.agent_id,
            "session_id": self.session_id,
            "run_id": self.run_id,
            "span_id": self.span_id,
            "parent_span_id": self.parent_span_id,
            "event_type": self.event_type.value,
            "payload": self.payload,
            "timestamp": self.timestamp.isoformat(),
            "trace_id": self.trace_id,
            "actor_type": self.actor_type,
            "actor_id": self.actor_id,
            "actor_display": self.actor_display,
            "policy_decision_id": self.policy_decision_id,
            "policy_refs": self.policy_refs,
            "approval_id": self.approval_id,
            "cost_record": self.cost_record,
            "redaction_status": self.redaction_status,
            "schema_version": self.schema_version,
            "previous_hash": self.previous_hash,
            "integrity_hash": self.integrity_hash,
        }

    @property
    def chain_key(self) -> str:
        """Return the stable run/session key used for integrity chaining."""
        return self.run_id or self.session_id

    def compute_integrity_hash(self) -> str:
        """Compute a deterministic SHA-256 digest over the event and prior link."""
        content = self.to_dict()
        content["integrity_hash"] = None
        canonical = json.dumps(content, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(canonical.encode()).hexdigest()

    @classmethod
    def from_row(cls, row: tuple) -> "AuditEvent":
        """Create AuditEvent from a database row."""
        if len(row) == 8:
            event_id, agent_id, session_id, span_id, event_type, payload, timestamp, trace_id = row
            return cls(
                event_id=uuid.UUID(event_id),
                agent_id=agent_id,
                session_id=session_id,
                span_id=span_id,
                event_type=AuditEventType(event_type),
                payload=json.loads(payload),
                timestamp=datetime.fromisoformat(timestamp),
                trace_id=trace_id,
            )

        (
            event_id,
            agent_id,
            session_id,
            run_id,
            span_id,
            parent_span_id,
            event_type,
            payload,
            timestamp,
            trace_id,
            actor_type,
            actor_id,
            actor_display,
            policy_decision_id,
            policy_refs,
            approval_id,
            cost_record,
            redaction_status,
            schema_version,
            previous_hash,
            integrity_hash,
        ) = row
        return cls(
            event_id=uuid.UUID(event_id),
            agent_id=agent_id,
            session_id=session_id,
            run_id=run_id,
            span_id=span_id,
            parent_span_id=parent_span_id,
            event_type=AuditEventType(event_type),
            payload=json.loads(payload),
            timestamp=datetime.fromisoformat(timestamp),
            trace_id=trace_id,
            actor_type=actor_type,
            actor_id=actor_id,
            actor_display=actor_display,
            policy_decision_id=policy_decision_id,
            policy_refs=json.loads(policy_refs or "[]"),
            approval_id=approval_id,
            cost_record=json.loads(cost_record) if cost_record else None,
            redaction_status=redaction_status,
            schema_version=schema_version,
            previous_hash=previous_hash,
            integrity_hash=integrity_hash,
        )


class AuditQuery:
    """Query filters for audit events."""

    def __init__(
        self,
        agent_id: str | None = None,
        session_id: str | None = None,
        run_id: str | None = None,
        time_range_start: datetime | None = None,
        time_range_end: datetime | None = None,
        event_type: AuditEventType | None = None,
        limit: int = 100,
        skip: int = 0,
    ):
        self.agent_id = agent_id
        self.session_id = session_id
        self.run_id = run_id
        self.time_range_start = time_range_start
        self.time_range_end = time_range_end
        self.event_type = event_type
        self.limit = limit
        self.skip = skip


class AuditLog:
    """Audit logging service using aiosqlite."""

    def __init__(self, db_path: str | None = None):
        self.db_path = db_path or DATABASE_PATH
        self._db: aiosqlite.Connection | None = None
        self._lock = asyncio.Lock()

    async def initialize(self) -> None:
        """Initialize the database connection and create tables if needed."""
        async with self._lock:
            self._db = await aiosqlite.connect(self.db_path)
            self._db.row_factory = aiosqlite.Row
            await self._db.executescript(AUDIT_TABLE_SCHEMA)
            await self._migrate_schema()
            for index_sql in AUDIT_TABLE_INDEXES:
                await self._db.execute(index_sql)
            if await self._needs_integrity_backfill():
                await self._backfill_integrity_hashes()
            await self._db.commit()

    async def _migrate_schema(self) -> None:
        """Add governed-operation columns to databases created by older releases."""
        assert self._db is not None
        async with self._db.execute("PRAGMA table_info(audit_events)") as cursor:
            existing_columns = {row[1] for row in await cursor.fetchall()}

        for column, definition in AUDIT_COLUMN_MIGRATIONS.items():
            if column not in existing_columns:
                await self._db.execute(f"ALTER TABLE audit_events ADD COLUMN {column} {definition}")

    async def _backfill_integrity_hashes(self) -> None:
        """Hash-chain legacy rows in stable insertion order."""
        assert self._db is not None
        async with self._db.execute(
            f"SELECT {AUDIT_SELECT_COLUMNS} FROM audit_events ORDER BY rowid"
        ) as cursor:
            rows = await cursor.fetchall()

        prior_by_chain: dict[str, str] = {}
        for row in rows:
            event = AuditEvent.from_row(tuple(row))
            if event.integrity_hash:
                prior_by_chain[event.chain_key] = event.integrity_hash
                continue

            event.previous_hash = prior_by_chain.get(event.chain_key)
            event.integrity_hash = event.compute_integrity_hash()
            prior_by_chain[event.chain_key] = event.integrity_hash
            await self._db.execute(
                """
                UPDATE audit_events
                SET previous_hash = ?, integrity_hash = ?
                WHERE event_id = ?
                """,
                (event.previous_hash, event.integrity_hash, str(event.event_id)),
            )

    async def _needs_integrity_backfill(self) -> bool:
        """Check the partial index for legacy rows that still need hashes."""
        assert self._db is not None
        async with self._db.execute(
            """
            SELECT EXISTS(
                SELECT 1 FROM audit_events
                WHERE integrity_hash IS NULL OR integrity_hash = ''
            )
            """
        ) as cursor:
            row = await cursor.fetchone()
        return bool(row[0])

    async def close(self) -> None:
        """Close the database connection."""
        async with self._lock:
            if self._db:
                await self._db.close()
                self._db = None

    async def log(self, event: AuditEvent) -> None:
        """Append an audit event to the database.

        Args:
            event: The audit event to log.
        """
        if not self._db:
            await self.initialize()

        async with self._lock:
            assert self._db is not None
            if event.run_id:
                previous_query = """
                    SELECT integrity_hash FROM audit_events
                    WHERE run_id = ? AND integrity_hash IS NOT NULL
                    ORDER BY rowid DESC LIMIT 1
                """
                previous_params = (event.run_id,)
            else:
                previous_query = """
                    SELECT integrity_hash FROM audit_events
                    WHERE run_id IS NULL AND session_id = ? AND integrity_hash IS NOT NULL
                    ORDER BY rowid DESC LIMIT 1
                """
                previous_params = (event.session_id,)

            async with self._db.execute(previous_query, previous_params) as cursor:
                previous_row = await cursor.fetchone()
            event.previous_hash = previous_row[0] if previous_row else None
            event.integrity_hash = event.compute_integrity_hash()

            await self._db.execute(
                """
                INSERT INTO audit_events
                (event_id, agent_id, session_id, run_id, span_id, parent_span_id,
                 event_type, payload, timestamp, trace_id, actor_type, actor_id,
                 actor_display, policy_decision_id, policy_refs, approval_id,
                 cost_record, redaction_status, schema_version, previous_hash,
                 integrity_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(event.event_id),
                    event.agent_id,
                    event.session_id,
                    event.run_id,
                    event.span_id,
                    event.parent_span_id,
                    event.event_type.value,
                    json.dumps(event.payload),
                    event.timestamp.isoformat(),
                    event.trace_id,
                    event.actor_type,
                    event.actor_id,
                    event.actor_display,
                    event.policy_decision_id,
                    json.dumps(event.policy_refs),
                    event.approval_id,
                    json.dumps(event.cost_record) if event.cost_record is not None else None,
                    event.redaction_status,
                    event.schema_version,
                    event.previous_hash,
                    event.integrity_hash,
                ),
            )
            await self._db.commit()

    async def log_with_otel_context(
        self,
        event: AuditEvent,
        auto_capture_trace: bool = True,
        auto_capture_span: bool = True,
    ) -> None:
        """Append an audit event, optionally auto-populating trace_id and span_id from OTel.

        If auto_capture_trace is True and the event's trace_id is None,
        the current OTel span context will be used to populate it.
        Similarly for auto_capture_span and span_id.

        Args:
            event: The audit event to log.
            auto_capture_trace: Whether to auto-capture trace_id from OTel context.
            auto_capture_span: Whether to auto-capture span_id from OTel context.
        """
        if auto_capture_trace or auto_capture_span:
            otel_trace_id, otel_span_id = _get_otel_trace_context()

            if auto_capture_trace and event.trace_id is None and otel_trace_id is not None:
                event.trace_id = otel_trace_id
            if auto_capture_span and event.span_id is None and otel_span_id is not None:
                event.span_id = otel_span_id

        await self.log(event)

    async def query(self, filters: AuditQuery) -> list[AuditEvent]:
        """Query audit events with filters and pagination.

        Args:
            filters: Query filters including agent_id, session_id, run_id, time ranges,
                event_type, limit, and skip.

        Returns:
            List of matching audit events ordered by timestamp descending.
        """
        if not self._db:
            await self.initialize()

        conditions = []
        params: list[Any] = []

        if filters.agent_id:
            conditions.append("agent_id = ?")
            params.append(filters.agent_id)
        if filters.session_id:
            conditions.append("session_id = ?")
            params.append(filters.session_id)
        if filters.run_id:
            conditions.append("run_id = ?")
            params.append(filters.run_id)
        if filters.time_range_start:
            conditions.append("timestamp >= ?")
            params.append(filters.time_range_start.isoformat())
        if filters.time_range_end:
            conditions.append("timestamp <= ?")
            params.append(filters.time_range_end.isoformat())
        if filters.event_type:
            conditions.append("event_type = ?")
            params.append(filters.event_type.value)

        where_clause = ""
        if conditions:
            where_clause = "WHERE " + " AND ".join(conditions)

        query_parts = [
            f"SELECT {AUDIT_SELECT_COLUMNS}",
            "FROM audit_events",
        ]
        if where_clause:
            query_parts.append(where_clause)
        query_parts.extend(
            [
                "ORDER BY timestamp DESC",
                "LIMIT ? OFFSET ?",
            ]
        )
        query_sql = "\n".join(query_parts)
        params.extend([filters.limit, filters.skip])

        async with self._lock:
            async with self._db.execute(query_sql, params) as cursor:
                rows = await cursor.fetchall()

        return [AuditEvent.from_row(tuple(row)) for row in rows]

    async def get_trace(self, trace_id: str) -> list[AuditEvent]:
        """Get all events for a specific trace.

        Args:
            trace_id: The trace ID to look up.

        Returns:
            List of audit events for the trace, ordered by timestamp.
        """
        if not self._db:
            await self.initialize()

        async with self._lock:
            async with self._db.execute(
                f"""
                SELECT {AUDIT_SELECT_COLUMNS}
                FROM audit_events
                WHERE trace_id = ?
                ORDER BY timestamp ASC
                """,
                (trace_id,),
            ) as cursor:
                rows = await cursor.fetchall()

        return [AuditEvent.from_row(tuple(row)) for row in rows]

    async def export_evidence(
        self,
        *,
        run_id: str | None = None,
        session_id: str | None = None,
    ) -> dict[str, Any]:
        """Export and verify a run or session evidence hash chain."""
        if bool(run_id) == bool(session_id):
            raise ValueError("Provide exactly one of run_id or session_id")
        if not self._db:
            await self.initialize()

        field = "run_id" if run_id else "session_id"
        value = run_id or session_id
        async with self._lock:
            assert self._db is not None
            async with self._db.execute(
                f"""
                SELECT {AUDIT_SELECT_COLUMNS}
                FROM audit_events
                WHERE {field} = ?
                ORDER BY rowid
                """,
                (value,),
            ) as cursor:
                rows = await cursor.fetchall()

        events = [AuditEvent.from_row(tuple(row)) for row in rows]
        errors: list[str] = []
        previous_by_chain: dict[str, str | None] = {}
        for event in events:
            previous_hash = previous_by_chain.get(event.chain_key)
            if event.previous_hash != previous_hash:
                errors.append(f"Event {event.event_id} has an invalid previous_hash")
            if event.integrity_hash != event.compute_integrity_hash():
                errors.append(f"Event {event.event_id} has an invalid integrity_hash")
            previous_by_chain[event.chain_key] = event.integrity_hash

        chain_roots = sorted(root for root in previous_by_chain.values() if root)
        if len(chain_roots) == 1:
            chain_root = chain_roots[0]
        elif chain_roots:
            chain_root = hashlib.sha256("".join(chain_roots).encode()).hexdigest()
        else:
            chain_root = None

        return {
            "schema_version": "1.0",
            "algorithm": "sha256",
            field: value,
            "event_count": len(events),
            "chain_root": chain_root,
            "verified": not errors,
            "errors": errors,
            "events": [event.to_dict() for event in events],
        }


# Global audit log instance
_audit_log: AuditLog | None = None
_audit_log_lock = asyncio.Lock()

# Global buffered audit log for background flushing
_buffered_audit_log: "BufferedAuditLog | None" = None
_buffered_audit_log_lock = asyncio.Lock()


async def get_audit_log() -> AuditLog:
    """Get the global audit log instance."""
    global _audit_log
    async with _audit_log_lock:
        if _audit_log is None:
            _audit_log = AuditLog()
            await _audit_log.initialize()
        return _audit_log


async def close_audit_log() -> None:
    """Close the global audit log instance."""
    global _audit_log
    async with _audit_log_lock:
        if _audit_log is not None:
            await _audit_log.close()
            _audit_log = None


class BufferedAuditLog:
    """Audit log with in-memory buffer for high-throughput scenarios.

    Events are buffered in memory and flushed periodically to the database.
    This reduces database I/O for high-volume audit logging.
    """

    def __init__(self, db_path: str | None = None, buffer_size: int = 100):
        self._audit_log = AuditLog(db_path=db_path)
        self._buffer: list[AuditEvent] = []
        self._buffer_size = buffer_size
        self._lock = asyncio.Lock()
        self._flush_task: asyncio.Task | None = None
        self._running = False

    async def initialize(self) -> None:
        """Initialize the underlying audit log database."""
        await self._audit_log.initialize()

    async def close(self) -> None:
        """Stop the flush task and close the database connection."""
        self._running = False
        if self._flush_task:
            self._flush_task.cancel()
            try:
                await self._flush_task
            except asyncio.CancelledError:
                pass
            self._flush_task = None

        # Final flush of remaining events
        await self._flush_buffer()

        await self._audit_log.close()

    async def log(self, event: AuditEvent) -> None:
        """Buffer an audit event for later database write.

        Args:
            event: The audit event to buffer.
        """
        async with self._lock:
            self._buffer.append(event)
            if len(self._buffer) >= self._buffer_size:
                await self._flush_buffer_locked()

    async def _flush_buffer_locked(self) -> None:
        """Flush buffer while holding the lock."""
        if not self._buffer:
            return

        events_to_flush = self._buffer.copy()
        self._buffer.clear()

        # Write events to database outside the lock to avoid blocking
        for event in events_to_flush:
            try:
                await self._audit_log.log(event)
            except Exception:
                logger.exception("Failed to flush audit event to database")

    async def _flush_buffer(self) -> None:
        """Flush buffered events to the database."""
        async with self._lock:
            await self._flush_buffer_locked()

    def start_flush_task(self, interval_seconds: float = 5.0) -> None:
        """Start a background task to periodically flush the buffer.

        Args:
            interval_seconds: How often to flush (default: 5 seconds).
        """
        if self._flush_task is not None:
            return

        self._running = True
        self._flush_task = asyncio.create_task(self._flush_loop(interval_seconds))

    async def _flush_loop(self, interval_seconds: float) -> None:
        """Background loop that periodically flushes the buffer."""
        while self._running:
            try:
                await asyncio.sleep(interval_seconds)
                await self._flush_buffer()
            except asyncio.CancelledError:
                break
            except Exception:
                logger.exception("Error in buffered audit log flush loop")

    async def query(self, filters: AuditQuery) -> list[AuditEvent]:
        """Query audit events (bypasses buffer, queries database directly)."""
        return await self._audit_log.query(filters)

    async def get_trace(self, trace_id: str) -> list[AuditEvent]:
        """Get all events for a trace (bypasses buffer, queries database directly)."""
        return await self._audit_log.get_trace(trace_id)


async def get_buffered_audit_log() -> BufferedAuditLog:
    """Get the global buffered audit log instance."""
    global _buffered_audit_log
    async with _buffered_audit_log_lock:
        if _buffered_audit_log is None:
            _buffered_audit_log = BufferedAuditLog()
            await _buffered_audit_log.initialize()
            _buffered_audit_log.start_flush_task(interval_seconds=5.0)
        return _buffered_audit_log


async def close_buffered_audit_log() -> None:
    """Close the global buffered audit log instance."""
    global _buffered_audit_log
    async with _buffered_audit_log_lock:
        if _buffered_audit_log is not None:
            await _buffered_audit_log.close()
            _buffered_audit_log = None
