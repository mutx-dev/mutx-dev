"""
Pydantic response models for the MUTX SDK.

These typed models represent the structured responses returned by all SDK methods.
Each model provides:
- Typed field access with proper Python types (UUID, datetime, etc.)
- Pydantic validation on construction via ``model_validate(data)``
- A backward-compatible ``.dict()`` method (alias for ``model_dump()``)
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class _SDKModel(BaseModel):
    """Base class for all SDK response models.

    Provides a ``.dict()`` compatibility alias so that callers that relied on the
    old plain-class interface or Pydantic v1 semantics continue to work without
    changes.
    """

    model_config = ConfigDict(populate_by_name=True)

    def dict(self, **kwargs: Any) -> dict[str, Any]:
        """Return a plain dict representation (alias for :meth:`model_dump`)."""
        return self.model_dump(**kwargs)


# ---------------------------------------------------------------------------
# Agent action responses
# ---------------------------------------------------------------------------


class AgentActionResponse(_SDKModel):
    """Response from lightweight agent action endpoints (deploy / stop).

    ``deployment_id`` is present on deploy-style responses; ``status`` is always
    set.  Any additional fields returned by the API are stored transparently.
    """

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    status: str
    deployment_id: Optional[str] = None
    message: Optional[str] = None


# ---------------------------------------------------------------------------
# Deployment log / metric entries
# ---------------------------------------------------------------------------


class DeploymentLog(_SDKModel):
    """A single deployment log entry as returned by
    ``GET /deployments/{id}/logs``."""

    id: UUID
    agent_id: UUID
    level: str
    message: str
    extra_data: Optional[str] = None
    timestamp: datetime


class DeploymentMetric(_SDKModel):
    """A single deployment metric snapshot as returned by
    ``GET /deployments/{id}/metrics``."""

    id: UUID
    agent_id: UUID
    cpu_usage: Optional[float] = None
    memory_usage: Optional[float] = None
    timestamp: datetime


# ---------------------------------------------------------------------------
# Webhook test result
# ---------------------------------------------------------------------------


class WebhookTestResult(_SDKModel):
    """Result of a webhook test operation (``POST /webhooks/{id}/test``)."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    status: str
    message: Optional[str] = None
