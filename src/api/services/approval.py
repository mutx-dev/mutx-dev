"""
Approval service for human-in-the-loop workflows.

Provides async storage and state management for approval requests,
with optional webhook notifications on new pending requests.
"""

import asyncio
import logging
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

import httpx
from pydantic import BaseModel, Field

from src.api.config import get_settings

logger = logging.getLogger(__name__)


class ApprovalStatus(str, Enum):
    """Possible states for an approval request."""

    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"


class ApprovalRequest(BaseModel):
    """In-memory approval request record."""

    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    agent_id: str
    session_id: str
    action_type: str
    payload: dict[str, Any] = Field(default_factory=dict)
    status: ApprovalStatus = ApprovalStatus.PENDING
    requester: str
    approver: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resolved_at: Optional[datetime] = None
    comment: Optional[str] = None

    model_config = {"use_enum_values": True}


class ApprovalService:
    """
    Thread-safe in-memory store for approval requests.

    Optionally sends a webhook to ``approval_webhook_url`` whenever a new
    PENDING request is created.
    """

    def __init__(self) -> None:
        self._store: dict[str, ApprovalRequest] = {}
        self._lock = asyncio.Lock()

    # ------------------------------------------------------------------
    # Core mutations
    # ------------------------------------------------------------------

    async def request_approval(self, req: ApprovalRequest) -> ApprovalRequest:
        """
        Persist a new PENDING approval request and fire an optional webhook.
        """
        async with self._lock:
            self._store[str(req.id)] = req

        settings = get_settings()
        webhook_url = getattr(settings, "approval_webhook_url", None)
        if webhook_url:
            await self._send_webhook(webhook_url, req)

        logger.info(
            "Approval request created: id=%s agent_id=%s action=%s",
            req.id,
            req.agent_id,
            req.action_type,
        )
        return req

    async def approve(
        self,
        request_id: str,
        approver: str,
        comment: Optional[str] = None,
    ) -> ApprovalRequest:
        """
        Transition a PENDING request to APPROVED.

        Raises ValueError if the request is not found or not pending.
        """
        async with self._lock:
            req = self._store.get(request_id)
            if req is None:
                raise ValueError(f"Approval request '{request_id}' not found")
            if req.status != ApprovalStatus.PENDING:
                raise ValueError(f"Cannot approve request in '{req.status}' state")

            req.status = ApprovalStatus.APPROVED
            req.approver = approver
            req.comment = comment
            req.resolved_at = datetime.now(timezone.utc)
            self._store[request_id] = req

        logger.info(
            "Approval request approved: id=%s approver=%s",
            request_id,
            approver,
        )
        return req

    async def reject(
        self,
        request_id: str,
        approver: str,
        comment: Optional[str] = None,
    ) -> ApprovalRequest:
        """
        Transition a PENDING request to REJECTED.

        Raises ValueError if the request is not found or not pending.
        """
        async with self._lock:
            req = self._store.get(request_id)
            if req is None:
                raise ValueError(f"Approval request '{request_id}' not found")
            if req.status != ApprovalStatus.PENDING:
                raise ValueError(f"Cannot reject request in '{req.status}' state")

            req.status = ApprovalStatus.REJECTED
            req.approver = approver
            req.comment = comment
            req.resolved_at = datetime.now(timezone.utc)
            self._store[request_id] = req

        logger.info(
            "Approval request rejected: id=%s approver=%s",
            request_id,
            approver,
        )
        return req

    # ------------------------------------------------------------------
    # Queries
    # ------------------------------------------------------------------

    async def list_pending(self, agent_id: Optional[str] = None) -> list[ApprovalRequest]:
        """
        Return all PENDING requests, optionally filtered by agent_id.
        """
        async with self._lock:
            results = [
                req
                for req in self._store.values()
                if req.status == ApprovalStatus.PENDING
                and (agent_id is None or req.agent_id == agent_id)
            ]
            return results

    async def update_payload(self, request_id: str, payload: dict[str, Any]) -> ApprovalRequest:
        """
        Replace the payload for an existing request and return the updated record.
        """
        async with self._lock:
            req = self._store.get(request_id)
            if req is None:
                raise ValueError(f"Approval request '{request_id}' not found")

            req.payload = payload
            self._store[request_id] = req
            return req

    # ------------------------------------------------------------------
    # Maintenance
    # ------------------------------------------------------------------

    async def expire_old(self, max_age_seconds: int = 3600) -> int:
        """
        Mark PENDING requests older than ``max_age_seconds`` as EXPIRED.

        Returns the number of requests that were expired.
        """
        now = datetime.now(timezone.utc)
        expired = 0

        async with self._lock:
            for key, req in list(self._store.items()):
                if req.status == ApprovalStatus.PENDING:
                    age = (now - req.created_at).total_seconds()
                    if age > max_age_seconds:
                        req.status = ApprovalStatus.EXPIRED
                        req.resolved_at = now
                        self._store[key] = req
                        expired += 1

        if expired:
            logger.info("Expired %d approval requests older than %ds", expired, max_age_seconds)

        return expired

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    @staticmethod
    async def _send_webhook(url: str, req: ApprovalRequest) -> None:
        """Fire-and-forget POST to the configured webhook URL."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(
                    url,
                    json={
                        "id": str(req.id),
                        "agent_id": req.agent_id,
                        "session_id": req.session_id,
                        "action_type": req.action_type,
                        "payload": req.payload,
                        "status": req.status,
                        "requester": req.requester,
                        "created_at": req.created_at.isoformat(),
                    },
                )
        except Exception as exc:
            logger.warning("Failed to send approval webhook to %s: %s", url, exc)


# ------------------------------------------------------------------
# Module-level singleton (compatible with FastAPI Depends)
# ------------------------------------------------------------------

_approval_service: Optional[ApprovalService] = None


async def get_approval_service() -> ApprovalService:
    """Return the shared ApprovalService instance."""
    global _approval_service
    if _approval_service is None:
        _approval_service = ApprovalService()
    return _approval_service


__all__ = [
    "ApprovalRequest",
    "ApprovalService",
    "ApprovalStatus",
    "get_approval_service",
]
