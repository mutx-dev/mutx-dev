"""Durable approval lifecycle and exact-action runtime enforcement."""

from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select

from src.api.services.approval import ApprovalStatus
from src.api.services.approval_persistence import (
    create_approval_record,
    get_visible_approval,
    resolve_approval,
    ApprovalTransitionConflictError,
)


@pytest.mark.asyncio
async def test_expired_approval_cannot_be_resolved(db_session, test_user, other_user):
    other_user.roles = ["ADMIN"]
    await db_session.commit()
    created = await create_approval_record(
        db_session,
        owner=test_user,
        agent_id="a",
        session_id="s",
        action_type="deploy",
        payload={},
        reviewer_id=other_user.id,
        idempotency_key="expiry",
        webhook_url=None,
        timeout_seconds=60,
    )
    created.record.expires_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    await db_session.commit()
    with pytest.raises(ApprovalTransitionConflictError):
        await resolve_approval(
            db_session,
            request_id=created.record.id,
            user=other_user,
            target_status=ApprovalStatus.APPROVED,
            comment=None,
        )
    record = await get_visible_approval(db_session, request_id=created.record.id, user=test_user)
    assert record.status == "EXPIRED"


@pytest.mark.asyncio
async def test_overdue_approval_routes_to_admin_and_records_audit(
    db_session, test_user, other_user
):
    from src.api.models.approval import ApprovalAuditEvent

    other_user.roles = ["DEVELOPER"]
    await db_session.commit()
    created = await create_approval_record(
        db_session,
        owner=test_user,
        agent_id="a",
        session_id="s",
        action_type="deploy",
        payload={},
        reviewer_id=other_user.id,
        idempotency_key="escalate",
        webhook_url=None,
        timeout_seconds=3600,
        escalation_seconds=60,
    )
    created.record.escalates_at = datetime.now(timezone.utc) - timedelta(seconds=1)
    await db_session.commit()
    record = await get_visible_approval(db_session, request_id=created.record.id, user=test_user)
    assert record.reviewer_id is None
    assert record.escalated_at is not None
    events = (
        (
            await db_session.execute(
                select(ApprovalAuditEvent).where(ApprovalAuditEvent.approval_id == record.id)
            )
        )
        .scalars()
        .all()
    )
    assert {event.event_type for event in events} == {"created", "escalated"}


@pytest.mark.asyncio
@pytest.mark.parametrize("runtime_defer", [False, True])
async def test_runtime_requires_exact_approved_action_and_consumes_once(
    db_session, test_user, other_user, tmp_path, runtime_defer
):
    from contextlib import asynccontextmanager
    from src.api.services.agent_runtime import ToolExecutionHandler
    from src.api.services.audit_log import AuditLog, AuditQuery
    from src.api.services.governance_runtime import GovernanceRuntime
    from src.api.services.policy_store import PolicyStore, Policy, Rule
    from src.security import PolicyDecision, PolicyEngine
    from src.security.policy import PolicySet

    test_user.plan = "starter"
    test_user.roles = ["DEVELOPER"]
    other_user.roles = ["ADMIN"]
    await db_session.commit()
    if not runtime_defer:
        await PolicyStore(db_session, test_user.id).create_policy(
            Policy(
                id="deploy-policy",
                name="deploy",
                enabled=True,
                version=1,
                rules=[
                    Rule(type="allow", pattern="deploy", action="require_approval", scope="tool")
                ],
            )
        )
    audit = AuditLog(str(tmp_path / "audit.db"))
    await audit.initialize()

    async def audit_factory():
        return audit

    @asynccontextmanager
    async def sessions():
        yield db_session

    engine = PolicyEngine()
    engine.add_policy(
        PolicySet(
            id="runtime",
            name="runtime",
            default_decision=(PolicyDecision.DEFER if runtime_defer else PolicyDecision.ALLOW),
        ),
        set_default=True,
    )
    governance = GovernanceRuntime(
        policy_engine=engine, audit_log_factory=audit_factory, install_default_policy=False
    )
    executor = ToolExecutionHandler(governance, session_factory=sessions)
    calls = []
    executor.register_handler("deploy", lambda args: calls.append(args) or "done")
    kwargs = dict(
        agent_id="managed-agent", session_id="session-1", run_id="run-1", user_id=str(test_user.id)
    )
    pending = await executor.execute_tool("deploy", {"target": "staging"}, **kwargs)
    assert pending["decision"] == "require_approval", pending
    assert calls == []
    approval_id = pending["approval_id"]
    import uuid

    await resolve_approval(
        db_session,
        request_id=uuid.UUID(approval_id),
        user=other_user,
        target_status=ApprovalStatus.APPROVED,
        comment="reviewed",
    )
    changed = await executor.execute_tool(
        "deploy", {"target": "production"}, approval_id=approval_id, **kwargs
    )
    assert "error" in changed
    assert calls == []
    assert (
        await executor.execute_tool(
            "deploy", {"target": "staging"}, approval_id=approval_id, **kwargs
        )
        == "done"
    )
    replay = await executor.execute_tool(
        "deploy", {"target": "staging"}, approval_id=approval_id, **kwargs
    )
    assert "error" in replay
    assert replay["resumable"] is False
    assert calls == [{"target": "staging"}]
    events = await audit.query(AuditQuery(run_id="run-1"))
    executed = [event for event in events if event.payload["outcome"] == "executed"]
    assert len(executed) == 1
    assert executed[0].approval_id == approval_id
    await audit.close()


@pytest.mark.asyncio
async def test_approval_audit_endpoint_enforces_visibility(
    client, other_user_client, db_session, test_user
):
    created = await create_approval_record(
        db_session,
        owner=test_user,
        agent_id="a",
        session_id="s",
        action_type="deploy",
        payload={},
        reviewer_id=None,
        idempotency_key="events",
        webhook_url=None,
    )
    test_user.roles = ["VIEWER"]
    await db_session.commit()
    response = await client.get(f"/v1/approvals/{created.record.id}/events")
    assert response.status_code == 200, response.text
    assert [item["event_type"] for item in response.json()] == ["created"]
    other = await other_user_client.get(f"/v1/approvals/{created.record.id}/events")
    assert other.status_code in {403, 404}


def test_approval_enforcement_migration_is_additive(tmp_path):
    import importlib.util
    from pathlib import Path
    from sqlalchemy import create_engine, inspect
    from alembic.migration import MigrationContext
    from alembic.operations import Operations

    path = (
        Path(__file__).parents[2]
        / "src/api/models/migrations/versions/a1c3e5f7b9d2_add_approval_enforcement.py"
    )
    spec = importlib.util.spec_from_file_location("approval_migration", path)
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    engine = create_engine(f"sqlite:///{tmp_path / 'migration.db'}")
    with engine.begin() as connection:
        connection.exec_driver_sql(
            "CREATE TABLE approval_requests (id CHAR(32) PRIMARY KEY, status VARCHAR(16), created_at TIMESTAMP)"
        )
        connection.exec_driver_sql(
            "INSERT INTO approval_requests VALUES ('old', 'PENDING', '2026-09-21 10:00:00')"
        )
        migration.op = Operations(MigrationContext.configure(connection))
        migration.upgrade()
        assert "approval_audit_events" in inspect(connection).get_table_names()
        assert connection.exec_driver_sql(
            "SELECT status, consumed_at FROM approval_requests"
        ).one() == ("PENDING", None)
        migration.downgrade()
        assert (
            connection.exec_driver_sql("SELECT status FROM approval_requests").scalar() == "PENDING"
        )
    engine.dispose()


@pytest.mark.asyncio
async def test_parallel_workers_can_consume_approval_only_once(tmp_path):
    import asyncio
    import uuid
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
    from src.api.database import Base
    from src.api.models import User
    from src.api.services.policy_approval import consume_approval

    engine = create_async_engine(f"sqlite+aiosqlite:///{tmp_path / 'claims.db'}")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    sessions = async_sessionmaker(engine, expire_on_commit=False)
    owner_id = uuid.uuid4()
    async with sessions() as db:
        owner = User(
            id=owner_id,
            email="owner@example.test",
            name="Owner",
            password_hash="unused",
            roles=["DEVELOPER"],
            plan="starter",
            is_active=True,
        )
        reviewer = User(
            id=uuid.uuid4(),
            email="admin@example.test",
            name="Admin",
            password_hash="unused",
            roles=["ADMIN"],
            plan="starter",
            is_active=True,
        )
        db.add_all([owner, reviewer])
        await db.commit()
        created = await create_approval_record(
            db,
            owner=owner,
            agent_id="a",
            session_id="s",
            action_type="deploy",
            payload={},
            reviewer_id=reviewer.id,
            idempotency_key="same-action",
            webhook_url=None,
        )
        request_id = created.record.id
        await resolve_approval(
            db,
            request_id=request_id,
            user=reviewer,
            target_status=ApprovalStatus.APPROVED,
            comment=None,
        )

    async def claim():
        async with sessions() as db:
            user = await db.get(User, owner_id)
            return await consume_approval(
                db, user=user, approval_id=request_id, dedupe_key="same-action"
            )

    assert sorted(await asyncio.gather(claim(), claim())) == [False, True]
    await engine.dispose()
