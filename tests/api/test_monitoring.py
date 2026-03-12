from datetime import datetime, timedelta

import pytest
from sqlalchemy import select

from src.api.models import AlertType, DeploymentEvent
from src.api.models.models import AgentStatus
from src.api.services.monitoring import monitor_agent_health


@pytest.mark.asyncio
async def test_monitor_marks_latest_deployment_failed_on_stale_heartbeat(
    db_session, test_agent, test_deployment
):
    test_agent.status = AgentStatus.RUNNING.value
    test_agent.last_heartbeat = datetime.utcnow() - timedelta(seconds=121)
    test_deployment.status = 'running'
    await db_session.commit()

    await monitor_agent_health(db_session)
    await db_session.refresh(test_agent)
    await db_session.refresh(test_deployment)

    assert test_agent.status == AgentStatus.FAILED.value
    assert test_deployment.status == 'failed'
    assert test_deployment.error_message is not None

    events = (
        await db_session.execute(
            select(DeploymentEvent).where(DeploymentEvent.deployment_id == test_deployment.id)
        )
    ).scalars().all()
    assert any(event.event_type == 'monitor_failed' for event in events)


@pytest.mark.asyncio
async def test_monitor_auto_heal_restores_latest_deployment(db_session, test_agent, test_deployment):
    test_agent.status = AgentStatus.FAILED.value
    test_agent.updated_at = datetime.utcnow() - timedelta(seconds=31)
    test_deployment.status = 'failed'
    test_deployment.error_message = 'System: Agent marked as FAILED due to heartbeat timeout (120s).'
    test_deployment.ended_at = datetime.utcnow()
    await db_session.commit()

    await monitor_agent_health(db_session)
    await db_session.refresh(test_agent)
    await db_session.refresh(test_deployment)

    assert test_agent.status == AgentStatus.RUNNING.value
    assert test_deployment.status == 'running'
    assert test_deployment.error_message is None
    assert test_deployment.ended_at is None

    events = (
        await db_session.execute(
            select(DeploymentEvent).where(DeploymentEvent.deployment_id == test_deployment.id)
        )
    ).scalars().all()
    assert any(event.event_type == 'monitor_restarted' for event in events)


@pytest.mark.asyncio
async def test_monitor_resolves_agent_down_alerts_on_recovery(db_session, test_agent, test_deployment):
    from src.api.models.models import Alert

    test_agent.status = AgentStatus.FAILED.value
    test_agent.updated_at = datetime.utcnow() - timedelta(seconds=31)
    test_deployment.status = 'failed'
    alert = Alert(
        agent_id=test_agent.id,
        type=AlertType.AGENT_DOWN,
        message='Agent is down',
        resolved=False,
    )
    db_session.add(alert)
    await db_session.commit()

    await monitor_agent_health(db_session)
    await db_session.refresh(alert)

    assert alert.resolved is True
    assert alert.resolved_at is not None
