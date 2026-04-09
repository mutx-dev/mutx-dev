"""Approvals SDK - /v1/approvals endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from uuid import UUID

import httpx


class ApprovalRequest:
    """Represents an approval request returned by the API.

    Attributes:
        id: Unique identifier for the approval request.
        agent_id: ID of the agent that triggered the approval.
        session_id: ID of the session during which the approval was requested.
        action_type: Type of action requiring approval (e.g. "deploy", "delete").
        payload: Arbitrary context payload passed when creating the request.
        status: Current status — PENDING, APPROVED, REJECTED, or EXPIRED.
        requester: Email of the user who submitted the request.
        approver: Email of the user who approved or rejected (None if pending).
        created_at: Timestamp when the request was created.
        resolved_at: Timestamp when the request was resolved (None if pending).
        comment: Optional comment from the approver.
    """

    def __init__(self, data: dict[str, Any]):
        self.id: UUID = UUID(data["id"])
        self.agent_id: str = data["agent_id"]
        self.session_id: str = data["session_id"]
        self.action_type: str = data["action_type"]
        self.payload: dict[str, Any] = data.get("payload", {})
        self.status: str = data["status"]
        self.requester: str = data["requester"]
        self.approver: Optional[str] = data.get("approver")
        self.created_at: datetime = datetime.fromisoformat(data["created_at"])
        self.resolved_at: Optional[datetime] = (
            datetime.fromisoformat(data["resolved_at"])
            if data.get("resolved_at")
            else None
        )
        self.comment: Optional[str] = data.get("comment")
        self._data = data

    def __repr__(self) -> str:
        return (
            f"ApprovalRequest(id={self.id}, agent_id={self.agent_id!r}, "
            f"action_type={self.action_type!r}, status={self.status!r})"
        )


class Approvals:
    """SDK resource for /v1/approvals endpoints.

    Supports both sync and async clients. Async methods are prefixed with ``a``.

    Example (sync)::

        >>> client = MutxClient(api_key="...")
        >>> req = client.approvals.create(
        ...     agent_id="agent-123",
        ...     session_id="session-456",
        ...     action_type="deploy",
        ...     payload={"target": "production"},
        ... )
        >>> print(req.status)
        PENDING

    Example (async)::

        >>> import httpx
        >>> async_client = httpx.AsyncClient(
        ...     base_url="https://api.mutx.dev",
        ...     headers={"Authorization": "Bearer ..."},
        ... )
        >>> approvals = Approvals(async_client)
        >>> req = await approvals.acreate(
        ...     agent_id="agent-123",
        ...     session_id="session-456",
        ...     action_type="deploy",
        ...     payload={"target": "production"},
        ... )
    """

    def __init__(self, client: httpx.Client | httpx.AsyncClient):
        self._client = client

    # ------------------------------------------------------------------
    # Sync methods
    # ------------------------------------------------------------------

    def create(
        self,
        agent_id: str,
        session_id: str,
        action_type: str,
        payload: Optional[dict[str, Any]] = None,
    ) -> ApprovalRequest:
        """
        Submit a new approval request (sync).

        Returns the created ``ApprovalRequest`` in ``PENDING`` status.
        """
        response = self._client.post(
            "/v1/approvals",
            json={
                "agent_id": agent_id,
                "session_id": session_id,
                "action_type": action_type,
                "payload": payload or {},
            },
        )
        response.raise_for_status()
        return ApprovalRequest(response.json())

    def get(self, request_id: str) -> ApprovalRequest:
        """Fetch a single approval request by ID."""
        response = self._client.get(f"/v1/approvals/{request_id}")
        response.raise_for_status()
        return ApprovalRequest(response.json())

    def list(
        self,
        status: Optional[str] = None,
        agent_id: Optional[str] = None,
    ) -> list[ApprovalRequest]:
        """
        List approval requests.

        Args:
            status: Filter by status (e.g. "PENDING", "APPROVED").
            agent_id: Filter by agent ID.
        """
        params: dict[str, Any] = {}
        if status is not None:
            params["status"] = status
        if agent_id is not None:
            params["agent_id"] = agent_id

        response = self._client.get("/v1/approvals", params=params)
        response.raise_for_status()
        return [ApprovalRequest(r) for r in response.json()]

    def approve(
        self,
        request_id: str,
        comment: Optional[str] = None,
    ) -> ApprovalRequest:
        """
        Approve a pending request (sync).

        Requires the authenticated user to have DEVELOPER or ADMIN role.
        """
        response = self._client.post(
            f"/v1/approvals/{request_id}/approve",
            json={"comment": comment},
        )
        response.raise_for_status()
        return ApprovalRequest(response.json())

    def reject(
        self,
        request_id: str,
        comment: Optional[str] = None,
    ) -> ApprovalRequest:
        """
        Reject a pending request (sync).

        Requires the authenticated user to have DEVELOPER or ADMIN role.
        """
        response = self._client.post(
            f"/v1/approvals/{request_id}/reject",
            json={"comment": comment},
        )
        response.raise_for_status()
        return ApprovalRequest(response.json())

    # ------------------------------------------------------------------
    # Async methods
    # ------------------------------------------------------------------

    async def acreate(
        self,
        agent_id: str,
        session_id: str,
        action_type: str,
        payload: Optional[dict[str, Any]] = None,
    ) -> ApprovalRequest:
        """Submit a new approval request (async)."""
        response = await self._client.post(
            "/v1/approvals",
            json={
                "agent_id": agent_id,
                "session_id": session_id,
                "action_type": action_type,
                "payload": payload or {},
            },
        )
        response.raise_for_status()
        return ApprovalRequest(response.json())

    async def aget(self, request_id: str) -> ApprovalRequest:
        """Fetch a single approval request by ID (async)."""
        response = await self._client.get(f"/v1/approvals/{request_id}")
        response.raise_for_status()
        return ApprovalRequest(response.json())

    async def alist(
        self,
        status: Optional[str] = None,
        agent_id: Optional[str] = None,
    ) -> list[ApprovalRequest]:
        """List approval requests (async)."""
        params: dict[str, Any] = {}
        if status is not None:
            params["status"] = status
        if agent_id is not None:
            params["agent_id"] = agent_id

        response = await self._client.get("/v1/approvals", params=params)
        response.raise_for_status()
        return [ApprovalRequest(r) for r in response.json()]

    async def aapprove(
        self,
        request_id: str,
        comment: Optional[str] = None,
    ) -> ApprovalRequest:
        """Approve a pending request (async)."""
        response = await self._client.post(
            f"/v1/approvals/{request_id}/approve",
            json={"comment": comment},
        )
        response.raise_for_status()
        return ApprovalRequest(response.json())

    async def areject(
        self,
        request_id: str,
        comment: Optional[str] = None,
    ) -> ApprovalRequest:
        """Reject a pending request (async)."""
        response = await self._client.post(
            f"/v1/approvals/{request_id}/reject",
            json={"comment": comment},
        )
        response.raise_for_status()
        return ApprovalRequest(response.json())
