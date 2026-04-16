"""
Tests for /v1/approvals endpoints and ApprovalService.
"""

import uuid
from datetime import datetime, timezone

import pytest
import pytest_asyncio
from httpx import AsyncClient

from src.api.services.approval import (
    ApprovalRequest,
    ApprovalService,
    ApprovalStatus,
)


# ------------------------------------------------------------------
# ApprovalService unit tests
# ------------------------------------------------------------------


class TestApprovalService:
    """Unit tests for ApprovalService business logic."""

    @pytest.mark.asyncio
    async def test_request_approval_creates_pending(self):
        service = ApprovalService()
        req = ApprovalRequest(
            agent_id="agent-1",
            session_id="session-1",
            action_type="deploy",
            payload={"target": "prod"},
            requester="user@example.com",
        )
        result = await service.request_approval(req)

        assert result.status == ApprovalStatus.PENDING
        assert result.requester == "user@example.com"
        assert result.approver is None
        assert result.resolved_at is None

    @pytest.mark.asyncio
    async def test_approve_transitions_to_approved(self):
        service = ApprovalService()
        req = ApprovalRequest(
            agent_id="agent-1",
            session_id="session-1",
            action_type="deploy",
            requester="user@example.com",
        )
        saved = await service.request_approval(req)

        approved = await service.approve(
            request_id=str(saved.id),
            approver="admin@example.com",
            comment="LGTM",
        )

        assert approved.status == ApprovalStatus.APPROVED
        assert approved.approver == "admin@example.com"
        assert approved.comment == "LGTM"
        assert approved.resolved_at is not None

    @pytest.mark.asyncio
    async def test_approve_wrong_state_raises(self):
        service = ApprovalService()
        req = ApprovalRequest(
            agent_id="agent-1",
            session_id="session-1",
            action_type="deploy",
            requester="user@example.com",
        )
        saved = await service.request_approval(req)
        await service.approve(str(saved.id), approver="admin@example.com")

        with pytest.raises(ValueError, match="Cannot approve"):
            await service.approve(str(saved.id), approver="admin@example.com")

    @pytest.mark.asyncio
    async def test_reject_transitions_to_rejected(self):
        service = ApprovalService()
        req = ApprovalRequest(
            agent_id="agent-1",
            session_id="session-1",
            action_type="deploy",
            requester="user@example.com",
        )
        saved = await service.request_approval(req)

        rejected = await service.reject(
            request_id=str(saved.id),
            approver="admin@example.com",
            comment="Not safe",
        )

        assert rejected.status == ApprovalStatus.REJECTED
        assert rejected.approver == "admin@example.com"
        assert rejected.comment == "Not safe"

    @pytest.mark.asyncio
    async def test_reject_wrong_state_raises(self):
        service = ApprovalService()
        req = ApprovalRequest(
            agent_id="agent-1",
            session_id="session-1",
            action_type="deploy",
            requester="user@example.com",
        )
        saved = await service.request_approval(req)
        await service.reject(str(saved.id), approver="admin@example.com")

        with pytest.raises(ValueError, match="Cannot reject"):
            await service.reject(str(saved.id), approver="admin@example.com")

    @pytest.mark.asyncio
    async def test_approve_nonexistent_raises(self):
        service = ApprovalService()
        with pytest.raises(ValueError, match="not found"):
            await service.approve(str(uuid.uuid4()), approver="admin@example.com")

    @pytest.mark.asyncio
    async def test_list_pending_filters_by_agent(self):
        service = ApprovalService()

        for i in range(3):
            await service.request_approval(
                ApprovalRequest(
                    agent_id=f"agent-{i}",
                    session_id=f"session-{i}",
                    action_type="deploy",
                    requester="user@example.com",
                )
            )

        pending = await service.list_pending(agent_id="agent-1")
        assert len(pending) == 1
        assert pending[0].agent_id == "agent-1"

    @pytest.mark.asyncio
    async def test_list_pending_returns_all_pending(self):
        service = ApprovalService()

        for i in range(3):
            await service.request_approval(
                ApprovalRequest(
                    agent_id=f"agent-{i}",
                    session_id=f"session-{i}",
                    action_type="deploy",
                    requester="user@example.com",
                )
            )

        pending = await service.list_pending()
        assert len(pending) == 3

    @pytest.mark.asyncio
    async def test_expire_old_marks_requests_expired(self):
        service = ApprovalService()
        req = ApprovalRequest(
            agent_id="agent-old",
            session_id="session-old",
            action_type="deploy",
            requester="user@example.com",
        )
        # Manually backdate the created_at
        req.created_at = datetime.now(timezone.utc).replace(
            year=datetime.now(timezone.utc).year - 1
        )
        await service.request_approval(req)

        expired = await service.expire_old(max_age_seconds=3600)
        assert expired == 1

        pending = await service.list_pending()
        assert len(pending) == 0

    @pytest.mark.asyncio
    async def test_expire_old_respects_max_age(self):
        service = ApprovalService()
        req = ApprovalRequest(
            agent_id="agent-fresh",
            session_id="session-fresh",
            action_type="deploy",
            requester="user@example.com",
        )
        await service.request_approval(req)

        expired = await service.expire_old(max_age_seconds=3600)
        assert expired == 0

        pending = await service.list_pending()
        assert len(pending) == 1


# ------------------------------------------------------------------
# Route integration tests
# ------------------------------------------------------------------


class TestApprovalRoutes:
    """Integration tests for /v1/approvals routes."""

    @pytest_asyncio.fixture
    async def approval_service(self):
        """Reset the global approval service singleton before each test."""
        # Reset the module-level singleton so each test gets a clean store
        import src.api.services.approval as approval_module

        approval_module._approval_service = None
        yield
        approval_module._approval_service = None

    @pytest.mark.asyncio
    async def test_create_approval(
        self,
        client: AsyncClient,
        test_user,
        approval_service,
    ):
        response = await client.post(
            "/v1/approvals",
            json={
                "agent_id": "agent-abc",
                "session_id": "session-xyz",
                "action_type": "deploy",
                "payload": {"target": "production"},
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["agent_id"] == "agent-abc"
        assert data["status"] == "PENDING"
        assert data["requester"] == test_user.email

    @pytest.mark.asyncio
    async def test_create_approval_persists_beyond_service_reset(
        self,
        client: AsyncClient,
        approval_service,
    ):
        create_resp = await client.post(
            "/v1/approvals",
            json={
                "agent_id": "agent-persist",
                "session_id": "session-persist",
                "action_type": "deploy",
                "payload": {"target": "production"},
            },
        )
        assert create_resp.status_code == 201
        request_id = create_resp.json()["id"]

        import src.api.services.approval as approval_module

        approval_module._approval_service = None

        fetch_resp = await client.get(f"/v1/approvals/{request_id}")
        assert fetch_resp.status_code == 200
        assert fetch_resp.json()["id"] == request_id
        assert fetch_resp.json()["status"] == "PENDING"

    @pytest.mark.asyncio
    async def test_get_approval(
        self,
        client: AsyncClient,
        approval_service,
    ):
        # Create first
        create_resp = await client.post(
            "/v1/approvals",
            json={
                "agent_id": "agent-get",
                "session_id": "session-get",
                "action_type": "query",
                "payload": {},
            },
        )
        request_id = create_resp.json()["id"]

        # Fetch
        response = await client.get(f"/v1/approvals/{request_id}")
        assert response.status_code == 200
        assert response.json()["id"] == request_id

    @pytest.mark.asyncio
    async def test_get_approval_not_found(
        self,
        client: AsyncClient,
        approval_service,
    ):
        response = await client.get(f"/v1/approvals/{uuid.uuid4()}")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_list_approvals_returns_pending(
        self,
        client: AsyncClient,
        approval_service,
    ):
        for i in range(3):
            await client.post(
                "/v1/approvals",
                json={
                    "agent_id": f"agent-list-{i}",
                    "session_id": f"session-list-{i}",
                    "action_type": "deploy",
                    "payload": {},
                },
            )

        response = await client.get("/v1/approvals")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

    @pytest.mark.asyncio
    async def test_list_approvals_filter_by_status(
        self,
        client: AsyncClient,
        approval_service,
    ):
        create_resp = await client.post(
            "/v1/approvals",
            json={
                "agent_id": "agent-filter",
                "session_id": "session-filter",
                "action_type": "deploy",
                "payload": {},
            },
        )
        request_id = create_resp.json()["id"]

        # Approve it
        await client.post(
            f"/v1/approvals/{request_id}/approve",
            json={"comment": "ok"},
        )

        # Filter by APPROVED status
        response = await client.get("/v1/approvals?status=APPROVED")
        assert response.status_code == 200
        assert all(r["status"] == "APPROVED" for r in response.json())

        # Filter by PENDING status
        response = await client.get("/v1/approvals?status=PENDING")
        assert response.status_code == 200
        assert all(r["status"] == "PENDING" for r in response.json())

    @pytest.mark.asyncio
    async def test_list_approvals_filter_by_agent(
        self,
        client: AsyncClient,
        approval_service,
    ):
        await client.post(
            "/v1/approvals",
            json={
                "agent_id": "agent-target",
                "session_id": "session-1",
                "action_type": "deploy",
                "payload": {},
            },
        )
        await client.post(
            "/v1/approvals",
            json={
                "agent_id": "agent-other",
                "session_id": "session-2",
                "action_type": "deploy",
                "payload": {},
            },
        )

        response = await client.get("/v1/approvals?agent_id=agent-target")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["agent_id"] == "agent-target"

    @pytest.mark.asyncio
    async def test_approve_request(
        self,
        client: AsyncClient,
        test_user,
        approval_service,
    ):
        create_resp = await client.post(
            "/v1/approvals",
            json={
                "agent_id": "agent-approve",
                "session_id": "session-approve",
                "action_type": "deploy",
                "payload": {},
            },
        )
        request_id = create_resp.json()["id"]

        # Give test_user a role attribute to pass role check
        original_role = getattr(test_user, "role", None)
        test_user.role = "ADMIN"

        try:
            response = await client.post(
                f"/v1/approvals/{request_id}/approve",
                json={"comment": "looks good"},
            )
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "APPROVED"
            assert data["approver"] == test_user.email
            assert data["comment"] == "looks good"
        finally:
            test_user.role = original_role

    @pytest.mark.asyncio
    async def test_reject_request(
        self,
        client: AsyncClient,
        test_user,
        approval_service,
    ):
        create_resp = await client.post(
            "/v1/approvals",
            json={
                "agent_id": "agent-reject",
                "session_id": "session-reject",
                "action_type": "deploy",
                "payload": {},
            },
        )
        request_id = create_resp.json()["id"]

        original_role = getattr(test_user, "role", None)
        test_user.role = "DEVELOPER"

        try:
            response = await client.post(
                f"/v1/approvals/{request_id}/reject",
                json={"comment": "not ready"},
            )
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "REJECTED"
            assert data["comment"] == "not ready"
        finally:
            test_user.role = original_role

    @pytest.mark.asyncio
    async def test_cannot_approve_already_approved(
        self,
        client: AsyncClient,
        test_user,
        approval_service,
    ):
        create_resp = await client.post(
            "/v1/approvals",
            json={
                "agent_id": "agent-double",
                "session_id": "session-double",
                "action_type": "deploy",
                "payload": {},
            },
        )
        request_id = create_resp.json()["id"]

        original_role = getattr(test_user, "role", None)
        test_user.role = "ADMIN"

        try:
            await client.post(f"/v1/approvals/{request_id}/approve", json={})
            second_resp = await client.post(
                f"/v1/approvals/{request_id}/approve",
                json={"comment": "again"},
            )
            assert second_resp.status_code == 400
            assert "Cannot approve" in second_resp.json()["detail"]
        finally:
            test_user.role = original_role
