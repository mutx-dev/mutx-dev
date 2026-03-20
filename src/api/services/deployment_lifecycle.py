from __future__ import annotations

import json
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from src.api.models import Agent, AgentStatus, Deployment, DeploymentEvent, DeploymentVersion


def _create_deployment_version(deployment: Deployment, db: AsyncSession) -> DeploymentVersion:
    config_snapshot = {
        "replicas": deployment.replicas,
        "version": deployment.version,
    }
    version = DeploymentVersion(
        deployment_id=deployment.id,
        version=1,
        config_snapshot=json.dumps(config_snapshot),
        status="current",
    )
    db.add(version)
    return version


async def create_deployment_record(
    *,
    agent: Agent,
    db: AsyncSession,
    replicas: int = 1,
    version: str = "v1.0.0",
    event_type: str = "create",
) -> Deployment:
    deployment = Deployment(
        agent_id=agent.id,
        status="pending",
        version=version,
        replicas=replicas,
        started_at=datetime.now(timezone.utc),
    )
    db.add(deployment)
    await db.flush()

    _create_deployment_version(deployment, db)
    db.add(
        DeploymentEvent(
            deployment_id=deployment.id,
            event_type=event_type,
            status="pending",
        )
    )
    agent.status = AgentStatus.RUNNING.value
    return deployment
