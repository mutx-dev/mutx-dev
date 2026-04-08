"""
Tests for Audit Logging Service.

Tests the audit log service, routes, and background task functionality.
"""

import asyncio
import json
import tempfile
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio

# Import the audit log module
from src.api.services.audit_log import (
    AuditEvent,
    AuditEventType,
    AuditLog,
    AuditQuery,
    get_audit_log,
    close_audit_log,
)


class TestAuditEventType:
    """Tests for AuditEventType enum."""

    def test_event_types_exist(self):
        """Test all expected event types are defined."""
        assert AuditEventType.AGENT_START.value == "AGENT_START"
        assert AuditEventType.LLM_CALL.value == "LLM_CALL"
        assert AuditEventType.TOOL_CALL.value == "TOOL_CALL"
        assert AuditEventType.POLICY_CHECK.value == "POLICY_CHECK"
        assert AuditEventType.GUARDRAIL_TRIGGER.value == "GUARDRAIL_TRIGGER"
        assert AuditEventType.AGENT_END.value == "AGENT_END"

    def test_event_type_is_string_enum(self):
        """Test event types can be compared by value."""
        assert AuditEventType.AGENT_START == AuditEventType("AGENT_START")
        assert AuditEventType.LLM_CALL == AuditEventType("LLM_CALL")


class TestAuditEvent:
    """Tests for AuditEvent model."""

    def test_create_audit_event(self):
        """Test creating an audit event."""
        event_id = uuid.uuid4()
        agent_id = "test-agent-123"
        session_id = "session-456"
        event_type = AuditEventType.AGENT_START
        payload = {"message": "Agent started"}
        timestamp = datetime.now(timezone.utc)

        event = AuditEvent(
            event_id=event_id,
            agent_id=agent_id,
            session_id=session_id,
            event_type=event_type,
            payload=payload,
            timestamp=timestamp,
        )

        assert event.event_id == event_id
        assert event.agent_id == agent_id
        assert event.session_id == session_id
        assert event.event_type == event_type
        assert event.payload == payload
        assert event.timestamp == timestamp
        assert event.span_id is None
        assert event.trace_id is None

    def test_audit_event_to_dict(self):
        """Test converting audit event to dictionary."""
        event_id = uuid.uuid4()
        timestamp = datetime.now(timezone.utc)

        event = AuditEvent(
            event_id=event_id,
            agent_id="agent-123",
            session_id="session-456",
            event_type=AuditEventType.LLM_CALL,
            payload={"model": "gpt-4", "tokens": 100},
            timestamp=timestamp,
            span_id="span-789",
            trace_id="trace-abc",
        )

        result = event.to_dict()

        assert result["event_id"] == str(event_id)
        assert result["agent_id"] == "agent-123"
        assert result["session_id"] == "session-456"
        assert result["event_type"] == "LLM_CALL"
        assert result["payload"] == {"model": "gpt-4", "tokens": 100}
        assert result["timestamp"] == timestamp.isoformat()
        assert result["span_id"] == "span-789"
        assert result["trace_id"] == "trace-abc"

    def test_audit_event_from_row(self):
        """Test creating audit event from database row."""
        event_id = str(uuid.uuid4())
        timestamp_str = datetime.now(timezone.utc).isoformat()
        row = (
            event_id,
            "agent-123",
            "session-456",
            "span-789",
            "TOOL_CALL",
            json.dumps({"tool": "search", "result": "success"}),
            timestamp_str,
            "trace-abc",
        )

        event = AuditEvent.from_row(row)

        assert str(event.event_id) == event_id
        assert event.agent_id == "agent-123"
        assert event.session_id == "session-456"
        assert event.span_id == "span-789"
        assert event.event_type == AuditEventType.TOOL_CALL
        assert event.payload == {"tool": "search", "result": "success"}
        assert event.trace_id == "trace-abc"


class TestAuditQuery:
    """Tests for AuditQuery model."""

    def test_default_query_values(self):
        """Test default query values."""
        query = AuditQuery()

        assert query.agent_id is None
        assert query.session_id is None
        assert query.time_range_start is None
        assert query.time_range_end is None
        assert query.event_type is None
        assert query.limit == 100
        assert query.skip == 0

    def test_query_with_filters(self):
        """Test query with all filters."""
        start = datetime.now(timezone.utc)
        end = start + timedelta(hours=1)

        query = AuditQuery(
            agent_id="agent-123",
            session_id="session-456",
            time_range_start=start,
            time_range_end=end,
            event_type=AuditEventType.LLM_CALL,
            limit=50,
            skip=10,
        )

        assert query.agent_id == "agent-123"
        assert query.session_id == "session-456"
        assert query.time_range_start == start
        assert query.time_range_end == end
        assert query.event_type == AuditEventType.LLM_CALL
        assert query.limit == 50
        assert query.skip == 10


class TestAuditLog:
    """Tests for AuditLog service class."""

    @pytest_asyncio.fixture
    async def audit_log(self):
        """Create an audit log with temporary database."""
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            db_path = f.name

        log = AuditLog(db_path=db_path)
        await log.initialize()
        yield log
        await log.close()

        # Cleanup
        import os
        os.unlink(db_path)

    @pytest.mark.asyncio
    async def test_initialize_creates_table(self, audit_log):
        """Test that initialize creates the audit table."""
        # Just verify initialization didn't fail - table creation is internal
        assert audit_log._db is not None

    @pytest.mark.asyncio
    async def test_log_single_event(self, audit_log):
        """Test logging a single audit event."""
        event = AuditEvent(
            event_id=uuid.uuid4(),
            agent_id="test-agent",
            session_id="test-session",
            event_type=AuditEventType.AGENT_START,
            payload={"message": "Agent started"},
            timestamp=datetime.now(timezone.utc),
        )

        await audit_log.log(event)

        # Query to verify
        query = AuditQuery(agent_id="test-agent", limit=10)
        results = await audit_log.query(query)

        assert len(results) == 1
        assert results[0].agent_id == "test-agent"
        assert results[0].event_type == AuditEventType.AGENT_START

    @pytest.mark.asyncio
    async def test_log_multiple_events(self, audit_log):
        """Test logging multiple audit events."""
        for i in range(5):
            event = AuditEvent(
                event_id=uuid.uuid4(),
                agent_id="test-agent",
                session_id=f"session-{i}",
                event_type=AuditEventType.LLM_CALL,
                payload={"call": i},
                timestamp=datetime.now(timezone.utc) + timedelta(seconds=i),
            )
            await audit_log.log(event)

        query = AuditQuery(agent_id="test-agent", limit=10)
        results = await audit_log.query(query)

        assert len(results) == 5

    @pytest.mark.asyncio
    async def test_query_by_session_id(self, audit_log):
        """Test querying by session ID."""
        event1 = AuditEvent(
            event_id=uuid.uuid4(),
            agent_id="agent-1",
            session_id="session-A",
            event_type=AuditEventType.AGENT_START,
            payload={},
            timestamp=datetime.now(timezone.utc),
        )
        event2 = AuditEvent(
            event_id=uuid.uuid4(),
            agent_id="agent-2",
            session_id="session-B",
            event_type=AuditEventType.AGENT_END,
            payload={},
            timestamp=datetime.now(timezone.utc),
        )
        await audit_log.log(event1)
        await audit_log.log(event2)

        query = AuditQuery(session_id="session-A")
        results = await audit_log.query(query)

        assert len(results) == 1
        assert results[0].session_id == "session-A"

    @pytest.mark.asyncio
    async def test_query_by_event_type(self, audit_log):
        """Test querying by event type."""
        event1 = AuditEvent(
            event_id=uuid.uuid4(),
            agent_id="agent-1",
            session_id="session-1",
            event_type=AuditEventType.LLM_CALL,
            payload={},
            timestamp=datetime.now(timezone.utc),
        )
        event2 = AuditEvent(
            event_id=uuid.uuid4(),
            agent_id="agent-1",
            session_id="session-1",
            event_type=AuditEventType.TOOL_CALL,
            payload={},
            timestamp=datetime.now(timezone.utc),
        )
        await audit_log.log(event1)
        await audit_log.log(event2)

        query = AuditQuery(event_type=AuditEventType.LLM_CALL)
        results = await audit_log.query(query)

        assert len(results) == 1
        assert results[0].event_type == AuditEventType.LLM_CALL

    @pytest.mark.asyncio
    async def test_query_time_range(self, audit_log):
        """Test querying by time range."""
        now = datetime.now(timezone.utc)
        
        event1 = AuditEvent(
            event_id=uuid.uuid4(),
            agent_id="agent-1",
            session_id="session-1",
            event_type=AuditEventType.AGENT_START,
            payload={},
            timestamp=now - timedelta(hours=2),
        )
        event2 = AuditEvent(
            event_id=uuid.uuid4(),
            agent_id="agent-1",
            session_id="session-1",
            event_type=AuditEventType.AGENT_END,
            payload={},
            timestamp=now,
        )
        await audit_log.log(event1)
        await audit_log.log(event2)

        query = AuditQuery(time_range_start=now - timedelta(hours=1))
        results = await audit_log.query(query)

        assert len(results) == 1
        assert results[0].event_type == AuditEventType.AGENT_END

    @pytest.mark.asyncio
    async def test_query_pagination(self, audit_log):
        """Test query pagination with limit and skip."""
        for i in range(10):
            event = AuditEvent(
                event_id=uuid.uuid4(),
                agent_id="agent-paginate",
                session_id="session-paginate",
                event_type=AuditEventType.LLM_CALL,
                payload={"index": i},
                timestamp=datetime.now(timezone.utc) + timedelta(seconds=i),
            )
            await audit_log.log(event)

        # Get first page
        query1 = AuditQuery(agent_id="agent-paginate", limit=3, skip=0)
        results1 = await audit_log.query(query1)
        assert len(results1) == 3

        # Get second page
        query2 = AuditQuery(agent_id="agent-paginate", limit=3, skip=3)
        results2 = await audit_log.query(query2)
        assert len(results2) == 3

        # Pages should be different
        assert results1[0].payload != results2[0].payload

    @pytest.mark.asyncio
    async def test_get_trace(self, audit_log):
        """Test getting all events for a trace."""
        trace_id = "trace-123"
        
        events = [
            AuditEvent(
                event_id=uuid.uuid4(),
                agent_id="agent-trace",
                session_id="session-trace",
                event_type=AuditEventType.AGENT_START,
                payload={"step": 1},
                timestamp=datetime.now(timezone.utc),
                trace_id=trace_id,
            ),
            AuditEvent(
                event_id=uuid.uuid4(),
                agent_id="agent-trace",
                session_id="session-trace",
                event_type=AuditEventType.LLM_CALL,
                payload={"step": 2},
                timestamp=datetime.now(timezone.utc) + timedelta(seconds=1),
                trace_id=trace_id,
            ),
            AuditEvent(
                event_id=uuid.uuid4(),
                agent_id="agent-trace",
                session_id="session-trace",
                event_type=AuditEventType.AGENT_END,
                payload={"step": 3},
                timestamp=datetime.now(timezone.utc) + timedelta(seconds=2),
                trace_id=trace_id,
            ),
        ]

        # Log another event with different trace
        other_event = AuditEvent(
            event_id=uuid.uuid4(),
            agent_id="agent-other",
            session_id="session-other",
            event_type=AuditEventType.AGENT_START,
            payload={},
            timestamp=datetime.now(timezone.utc),
            trace_id="other-trace",
        )

        for event in events:
            await audit_log.log(event)
        await audit_log.log(other_event)

        results = await audit_log.get_trace(trace_id)

        assert len(results) == 3
        # Should be ordered by timestamp ascending
        assert results[0].event_type == AuditEventType.AGENT_START
        assert results[1].event_type == AuditEventType.LLM_CALL
        assert results[2].event_type == AuditEventType.AGENT_END

    @pytest.mark.asyncio
    async def test_get_trace_not_found(self, audit_log):
        """Test getting a non-existent trace returns empty list."""
        results = await audit_log.get_trace("non-existent-trace")
        assert len(results) == 0

    @pytest.mark.asyncio
    async def test_query_no_results(self, audit_log):
        """Test query that returns no results."""
        query = AuditQuery(agent_id="non-existent-agent")
        results = await audit_log.query(query)
        assert len(results) == 0


class TestAuditLogGlobalInstance:
    """Tests for global audit log instance management."""

    @pytest.mark.asyncio
    async def test_get_audit_log_creates_instance(self):
        """Test get_audit_log creates and returns global instance."""
        # Reset global state
        import src.api.services.audit_log as audit_module
        audit_module._audit_log = None
        
        # Need to reset the lock too
        audit_module._audit_log_lock = asyncio.Lock()

        try:
            log = await get_audit_log()
            assert log is not None
            assert isinstance(log, AuditLog)
            
            # Second call should return same instance
            log2 = await get_audit_log()
            assert log is log2
        finally:
            await close_audit_log()

    @pytest.mark.asyncio
    async def test_close_audit_log(self):
        """Test closing the global audit log."""
        import src.api.services.audit_log as audit_module
        
        # Reset state
        audit_module._audit_log = None
        audit_module._audit_log_lock = asyncio.Lock()

        log = await get_audit_log()
        await close_audit_log()
        
        # Should be None after close
        assert audit_module._audit_log is None


class TestAuditEventPayload:
    """Tests for audit event payload handling."""

    @pytest.mark.asyncio
    async def test_payload_with_nested_objects(self):
        """Test payload with nested dictionaries and lists."""
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            db_path = f.name

        log = AuditLog(db_path=db_path)
        await log.initialize()

        try:
            event = AuditEvent(
                event_id=uuid.uuid4(),
                agent_id="agent-nested",
                session_id="session-nested",
                event_type=AuditEventType.LLM_CALL,
                payload={
                    "model": "gpt-4",
                    "messages": [
                        {"role": "user", "content": "Hello"},
                        {"role": "assistant", "content": "Hi"},
                    ],
                    "usage": {
                        "prompt_tokens": 10,
                        "completion_tokens": 20,
                        "total_tokens": 30,
                    },
                },
                timestamp=datetime.now(timezone.utc),
            )
            await log.log(event)

            query = AuditQuery(agent_id="agent-nested")
            results = await log.query(query)

            assert len(results) == 1
            assert results[0].payload["model"] == "gpt-4"
            assert len(results[0].payload["messages"]) == 2
            assert results[0].payload["usage"]["total_tokens"] == 30
        finally:
            await log.close()
            import os
            os.unlink(db_path)

    @pytest.mark.asyncio
    async def test_payload_with_special_characters(self):
        """Test payload with special characters."""
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            db_path = f.name

        log = AuditLog(db_path=db_path)
        await log.initialize()

        try:
            event = AuditEvent(
                event_id=uuid.uuid4(),
                agent_id="agent-special",
                session_id="session-special",
                event_type=AuditEventType.TOOL_CALL,
                payload={
                    "query": "Test with 'quotes' and \"double quotes\" and unicode: ñ 你好",
                    "newlines": "line1\nline2\rline3",
                },
                timestamp=datetime.now(timezone.utc),
            )
            await log.log(event)

            query = AuditQuery(agent_id="agent-special")
            results = await log.query(query)

            assert len(results) == 1
            assert "quotes" in results[0].payload["query"]
            assert "\n" in results[0].payload["newlines"]
        finally:
            await log.close()
            import os
            os.unlink(db_path)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
