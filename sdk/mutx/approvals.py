"""Approvals API SDK - /v1/approvals endpoints (Prompt 7 human-in-the-loop workflows)."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

import httpx


class ApprovalRequest:
    """Represents an approval request from the /v1/approvals API."""

    def __init__(self, data: dict[str, Any]):
        self.id: str = data["id"]
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
        return f"ApprovalRequest(id={self.id}, status={self.status})"


class Approvals:
    """SDK resource for /v1/approvals endpoints."""

    def __init__(self, client: httpx.Client | httpx.AsyncClient):
        self._client = client

    def _require_sync_client(self) -> None:
        if isinstance(self._client, httpx.AsyncClient):
            raise RuntimeError(
                "This resource requires a sync httpx.Client. For async clients, use the `a*` methods."
            )

    def _require_async_client(self) -> None:
        if not isinstance(self._client, httpx.AsyncClient):
            raise RuntimeError(
                "This async resource helper requires an async httpx.AsyncClient and an `a*` method call."
            )

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
        """Create a new approval request.

        Args:
            agent_id: ID of the agent requesting approval.
            session_id: ID of the session.
            action_type: Type of action being approved (e.g. "deploy").
            payload: Optional additional context as key-value pairs.
        """
        self._require_sync_client()
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

    def list(
        self,
        status: Optional[str] = None,
        agent_id: Optional[str] = None,
    ) -> list[ApprovalRequest]:
        """List approval requests.

        Args:
            status: Filter by status (e.g. "PENDING", "APPROVED", "REJECTED").
            agent_id: Filter by agent ID.
        """
        self._require_sync_client()
        params: dict[str, Any] = {}
        if status is not None:
            params["status"] = status
        if agent_id is not None:
            params["agent_id"] = agent_id
        response = self._client.get("/v1/approvals", params=params)
        response.raise_for_status()
        return [ApprovalRequest(r) for r in response.json()]

    def get(self, request_id: str) -> ApprovalRequest:
        """Fetch a single approval request by ID."""
        self._require_sync_client()
        response = self._client.get(f"/v1/approvals/{request_id}")
        response.raise_for_status()
        return ApprovalRequest(response.json())

    def approve(
        self,
        request_id: str,
        comment: Optional[str] = None,
    ) -> ApprovalRequest:
        """Approve a pending request.

        Args:
            request_id: ID of the approval request to approve.
            comment: Optional comment from the approver.
        """
        self._require_sync_client()
        response = self._client.post(
            f"/v1/approvals/{request_id}/approve",
            json={"comment": comment} if comment else {},
        )
        response.raise_for_status()
        return ApprovalRequest(response.json())

    def reject(
        self,
        request_id: str,
        comment: Optional[str] = None,
    ) -> ApprovalRequest:
        """Reject a pending request.

        Args:
            request_id: ID of the approval request to reject.
            comment: Optional comment from the approver.
        """
        self._require_sync_client()
        response = self._client.post(
            f"/v1/approvals/{request_id}/reject",
            json={"comment": comment} if comment else {},
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
        """Create a new approval request (async)."""
        self._require_async_client()
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

    async def alist(
        self,
        status: Optional[str] = None,
        agent_id: Optional[str] = None,
    ) -> list[ApprovalRequest]:
        """List approval requests (async)."""
        self._require_async_client()
        params: dict[str, Any] = {}
        if status is not None:
            params["status"] = status
        if agent_id is not None:
            params["agent_id"] = agent_id
        response = await self._client.get("/v1/approvals", params=params)
        response.raise_for_status()
        return [ApprovalRequest(r) for r in response.json()]

    async def aget(self, request_id: str) -> ApprovalRequest:
        """Fetch a single approval request by ID (async)."""
        self._require_async_client()
        response = await self._client.get(f"/v1/approvals/{request_id}")
        response.raise_for_status()
        return ApprovalRequest(response.json())

    async def aapprove(
        self,
        request_id: str,
        comment: Optional[str] = None,
    ) -> ApprovalRequest:
        """Approve a pending request (async)."""
        self._require_async_client()
        response = await self._client.post(
            f"/v1/approvals/{request_id}/approve",
            json={"comment": comment} if comment else {},
        )
        response.raise_for_status()
        return ApprovalRequest(response.json())

    async def areject(
        self,
        request_id: str,
        comment: Optional[str] = None,
    ) -> ApprovalRequest:
        """Reject a pending request (async)."""
        self._require_async_client()
        response = await self._client.post(
            f"/v1/approvals/{request_id}/reject",
            json={"comment": comment} if comment else {},
        )
        response.raise_for_status()
        return ApprovalRequest(response.json())
