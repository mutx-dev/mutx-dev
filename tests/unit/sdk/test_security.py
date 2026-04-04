"""Tests for security module (AARM SDK)."""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock, AsyncMock
from uuid import uuid4

import httpx
import pytest

from mutx.security import (
    ActionEvaluateResponse,
    ApprovalRequest,
    GovernanceMetrics,
    Security,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

def make_sync_client() -> httpx.Client:
    return httpx.Client()


def make_async_client() -> httpx.AsyncClient:
    return httpx.AsyncClient()


# ---------------------------------------------------------------------------
# ActionEvaluateResponse
# ---------------------------------------------------------------------------

class TestActionEvaluateResponse:
    def test_init_full_data(self):
        data = {
            "decision": "permit",
            "rule_id": "rule-001",
            "rule_name": "allow-all",
            "reason": "Action is allowed by policy.",
            "would_modify": True,
            "action_id": "act-abc",
            "action_hash": "hash-xyz",
        }
        resp = ActionEvaluateResponse(data)
        assert resp.decision == "permit"
        assert resp.rule_id == "rule-001"
        assert resp.rule_name == "allow-all"
        assert resp.reason == "Action is allowed by policy."
        assert resp.would_modify is True
        assert resp.action_id == "act-abc"
        assert resp.action_hash == "hash-xyz"
        assert resp._data is data

    def test_init_minimal_data(self):
        data = {
            "decision": "deny",
            "reason": "Blocked.",
            "action_id": "act-1",
            "action_hash": "h1",
        }
        resp = ActionEvaluateResponse(data)
        assert resp.decision == "deny"
        assert resp.rule_id is None
        assert resp.rule_name is None
        assert resp.reason == "Blocked."
        assert resp.would_modify is False
        assert resp.action_id == "act-1"
        assert resp.action_hash == "h1"


# ---------------------------------------------------------------------------
# ApprovalRequest
# ---------------------------------------------------------------------------

class TestApprovalRequest:
    def test_init_full_data(self):
        now = datetime.now(timezone.utc)
        later = now + timedelta(minutes=5)
        data = {
            "request_id": "req-001",
            "token": "tok-xyz",
            "status": "pending",
            "tool_name": "shell",
            "reason": "Running shell command",
            "created_at": now.isoformat(),
            "expires_at": later.isoformat(),
            "remaining_seconds": 300,
        }
        req = ApprovalRequest(data)
        assert req.request_id == "req-001"
        assert req.token == "tok-xyz"
        assert req.status == "pending"
        assert req.tool_name == "shell"
        assert req.reason == "Running shell command"
        assert req.created_at == now
        assert req.expires_at == later
        assert req.remaining_seconds == 300

    def test_init_minimal_data(self):
        now = datetime.now(timezone.utc)
        later = now + timedelta(minutes=5)
        data = {
            "request_id": "req-002",
            "token": "tok-abc",
            "status": "approved",
            "tool_name": "read_file",
            "created_at": now.isoformat(),
            "expires_at": later.isoformat(),
            "remaining_seconds": 200,
        }
        req = ApprovalRequest(data)
        assert req.reason == ""
        assert req.status == "approved"

    def test_repr(self):
        data = {
            "request_id": "req-repr",
            "token": "tok",
            "status": "denied",
            "tool_name": "write",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat(),
            "remaining_seconds": 300,
        }
        req = ApprovalRequest(data)
        r = repr(req)
        assert "req-repr" in r
        assert "denied" in r


# ---------------------------------------------------------------------------
# GovernanceMetrics
# ---------------------------------------------------------------------------

class TestGovernanceMetrics:
    def test_init_full_data(self):
        data = {
            "total_evaluations": 1000,
            "permits": 850,
            "denials": 100,
            "defers": 50,
            "pending_approvals": 12,
            "intent_drifts": 5,
            "active_sessions": 8,
            "avg_latency_ms": 23.4,
            "decisions_per_minute": 15,
            "decisions_per_hour": 900,
        }
        m = GovernanceMetrics(data)
        assert m.total_evaluations == 1000
        assert m.permits == 850
        assert m.denials == 100
        assert m.defers == 50
        assert m.pending_approvals == 12
        assert m.intent_drifts == 5
        assert m.active_sessions == 8
        assert m.avg_latency_ms == 23.4
        assert m.decisions_per_minute == 15
        assert m.decisions_per_hour == 900
        assert m._data is data

    def test_init_minimal_data(self):
        data = {
            "total_evaluations": 0,
            "permits": 0,
            "denials": 0,
            "defers": 0,
            "pending_approvals": 0,
        }
        m = GovernanceMetrics(data)
        assert m.intent_drifts == 0
        assert m.active_sessions == 0
        assert m.avg_latency_ms == 0.0
        assert m.decisions_per_minute == 0
        assert m.decisions_per_hour == 0


# ---------------------------------------------------------------------------
# Security – client-type guards
# ---------------------------------------------------------------------------

class TestSecurityClientGuards:
    def test_require_sync_client_raises_on_async(self):
        client = httpx.AsyncClient()
        sec = Security(client)
        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            sec.evaluate_action(
                tool_name="shell",
                tool_args={"cmd": "ls"},
                agent_id="agent-1",
                session_id="sess-1",
            )

    def test_require_async_client_raises_on_sync(self):
        client = httpx.Client()
        sec = Security(client)
        with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
            asyncio.run(sec.aevaluate_action(
                tool_name="shell",
                tool_args={"cmd": "ls"},
                agent_id="agent-1",
                session_id="sess-1",
            ))


# ---------------------------------------------------------------------------
# Security – evaluate_action / aevaluate_action
# ---------------------------------------------------------------------------

class TestSecurityEvaluateAction:
    def test_evaluate_action_returns_response(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "decision": "permit",
            "rule_id": "rule-001",
            "rule_name": "allow-shell",
            "reason": "Tool is permitted.",
            "would_modify": False,
            "action_id": "act-001",
            "action_hash": "hash-abc",
        }
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        sec = Security(mock_client)
        result = sec.evaluate_action(
            tool_name="shell",
            tool_args={"cmd": "echo hello"},
            agent_id="agent-1",
            session_id="sess-1",
            user_id="user-1",
            trigger="manual",
            runtime="mutx",
        )

        assert isinstance(result, ActionEvaluateResponse)
        assert result.decision == "permit"
        mock_client.post.assert_called_once()
        call_kwargs = mock_client.post.call_args
        assert call_kwargs[0][0] == "/security/actions/evaluate"
        assert call_kwargs[1]["json"]["tool_name"] == "shell"
        assert call_kwargs[1]["json"]["user_id"] == "user-1"

    def test_evaluate_action_raises_on_http_error(self):
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
            "Server error", request=MagicMock(), response=MagicMock()
        )
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        sec = Security(mock_client)
        with pytest.raises(httpx.HTTPStatusError):
            sec.evaluate_action(
                tool_name="shell",
                tool_args={},
                agent_id="agent-1",
                session_id="sess-1",
            )

    @pytest.mark.asyncio
    async def test_aevaluate_action_returns_response(self):
        mock_response = AsyncMock()
        mock_response.json.return_value = {
            "decision": "deny",
            "reason": "Blocked.",
            "action_id": "act-002",
            "action_hash": "hash-def",
        }
        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.post.return_value = mock_response

        sec = Security(mock_client)
        result = await sec.aevaluate_action(
            tool_name="write",
            tool_args={"path": "/etc/passwd"},
            agent_id="agent-1",
            session_id="sess-1",
        )

        assert isinstance(result, ActionEvaluateResponse)
        assert result.decision == "deny"


# ---------------------------------------------------------------------------
# Security – request_approval / arequest_approval
# ---------------------------------------------------------------------------

class TestSecurityRequestApproval:
    def test_request_approval_returns_approval_request(self):
        now = datetime.now(timezone.utc).isoformat()
        later = (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "request_id": "req-100",
            "token": "tok-100",
            "status": "pending",
            "tool_name": "shell",
            "reason": "Need approval",
            "created_at": now,
            "expires_at": later,
            "remaining_seconds": 300,
        }
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        sec = Security(mock_client)
        result = sec.request_approval(
            tool_name="shell",
            tool_args={"cmd": "rm -rf /"},
            agent_id="agent-1",
            session_id="sess-1",
            reason="Dangerous command",
            timeout_minutes=5,
            user_id="user-1",
        )

        assert isinstance(result, ApprovalRequest)
        assert result.request_id == "req-100"
        assert result.status == "pending"
        call_kwargs = mock_client.post.call_args
        assert call_kwargs[1]["json"]["reason"] == "Dangerous command"
        assert call_kwargs[1]["json"]["timeout_minutes"] == 5

    @pytest.mark.asyncio
    async def test_arequest_approval_returns_approval_request(self):
        now = datetime.now(timezone.utc).isoformat()
        later = (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()
        mock_response = AsyncMock()
        mock_response.json.return_value = {
            "request_id": "req-101",
            "token": "tok-101",
            "status": "pending",
            "tool_name": "shell",
            "reason": "Approval needed",
            "created_at": now,
            "expires_at": later,
            "remaining_seconds": 300,
        }
        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.post.return_value = mock_response

        sec = Security(mock_client)
        result = await sec.arequest_approval(
            tool_name="shell",
            tool_args={"cmd": "reboot"},
            agent_id="agent-1",
            session_id="sess-1",
            reason="Reboot machine",
            timeout_minutes=10,
        )

        assert isinstance(result, ApprovalRequest)
        assert result.request_id == "req-101"


# ---------------------------------------------------------------------------
# Security – get_approval / aget_approval
# ---------------------------------------------------------------------------

class TestSecurityGetApproval:
    def test_get_approval_returns_approval_request(self):
        now = datetime.now(timezone.utc).isoformat()
        later = (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "request_id": "req-200",
            "token": "tok-200",
            "status": "approved",
            "tool_name": "shell",
            "reason": "Approved",
            "created_at": now,
            "expires_at": later,
            "remaining_seconds": 0,
        }
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        sec = Security(mock_client)
        result = sec.get_approval("req-200")

        assert isinstance(result, ApprovalRequest)
        assert result.request_id == "req-200"
        assert result.status == "approved"
        mock_client.get.assert_called_once_with("/security/approvals/req-200")

    @pytest.mark.asyncio
    async def test_aget_approval_returns_approval_request(self):
        now = datetime.now(timezone.utc).isoformat()
        later = (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()
        mock_response = AsyncMock()
        mock_response.json.return_value = {
            "request_id": "req-201",
            "token": "tok-201",
            "status": "denied",
            "tool_name": "write",
            "reason": "Denied",
            "created_at": now,
            "expires_at": later,
            "remaining_seconds": 0,
        }
        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.get.return_value = mock_response

        sec = Security(mock_client)
        result = await sec.aget_approval("req-201")

        assert isinstance(result, ApprovalRequest)
        assert result.status == "denied"


# ---------------------------------------------------------------------------
# Security – list_pending_approvals / alist_pending_approvals
# ---------------------------------------------------------------------------

class TestSecurityListPendingApprovals:
    def test_list_pending_approvals_returns_list(self):
        now = datetime.now(timezone.utc).isoformat()
        later = (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()
        mock_response = MagicMock()
        mock_response.json.return_value = [
            {
                "request_id": "req-300",
                "token": "tok-300",
                "status": "pending",
                "tool_name": "shell",
                "reason": "",
                "created_at": now,
                "expires_at": later,
                "remaining_seconds": 200,
            },
            {
                "request_id": "req-301",
                "token": "tok-301",
                "status": "pending",
                "tool_name": "write",
                "reason": "",
                "created_at": now,
                "expires_at": later,
                "remaining_seconds": 180,
            },
        ]
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        sec = Security(mock_client)
        result = sec.list_pending_approvals()

        assert isinstance(result, list)
        assert len(result) == 2
        assert all(isinstance(r, ApprovalRequest) for r in result)
        assert result[0].request_id == "req-300"
        assert result[1].request_id == "req-301"

    @pytest.mark.asyncio
    async def test_alist_pending_approvals_returns_list(self):
        now = datetime.now(timezone.utc).isoformat()
        later = (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()
        mock_response = AsyncMock()
        mock_response.json.return_value = [
            {
                "request_id": "req-302",
                "token": "tok-302",
                "status": "pending",
                "tool_name": "shell",
                "reason": "",
                "created_at": now,
                "expires_at": later,
                "remaining_seconds": 150,
            },
        ]
        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.get.return_value = mock_response

        sec = Security(mock_client)
        result = await sec.alist_pending_approvals()

        assert isinstance(result, list)
        assert len(result) == 1


# ---------------------------------------------------------------------------
# Security – approve / aapprove
# ---------------------------------------------------------------------------

class TestSecurityApprove:
    def test_approve_returns_json(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "request_id": "req-400",
            "status": "approved",
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
        }
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        sec = Security(mock_client)
        result = sec.approve(token="tok-400", reviewer="alice", comment="Looks fine")

        assert isinstance(result, dict)
        assert result["status"] == "approved"
        mock_client.post.assert_called_once()
        call_kwargs = mock_client.post.call_args
        assert call_kwargs[0][0] == "/security/approvals/tok-400/approve"
        assert call_kwargs[1]["json"]["reviewer"] == "alice"
        assert call_kwargs[1]["json"]["comment"] == "Looks fine"

    @pytest.mark.asyncio
    async def test_aapprove_returns_json(self):
        mock_response = AsyncMock()
        mock_response.json.return_value = {
            "request_id": "req-401",
            "status": "approved",
        }
        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.post.return_value = mock_response

        sec = Security(mock_client)
        result = await sec.aapprove(token="tok-401", reviewer="bob")

        assert isinstance(result, dict)
        assert result["status"] == "approved"


# ---------------------------------------------------------------------------
# Security – deny / adeny
# ---------------------------------------------------------------------------

class TestSecurityDeny:
    def test_deny_returns_json(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "request_id": "req-500",
            "status": "denied",
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
        }
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        sec = Security(mock_client)
        result = sec.deny(token="tok-500", reviewer="carol", reason="Too risky")

        assert isinstance(result, dict)
        assert result["status"] == "denied"
        mock_client.post.assert_called_once()
        call_kwargs = mock_client.post.call_args
        assert call_kwargs[1]["json"]["reviewer"] == "carol"
        # Note: the SDK sends "comment" not "reason"
        assert call_kwargs[1]["json"]["comment"] == "Too risky"

    @pytest.mark.asyncio
    async def test_adeny_returns_json(self):
        mock_response = AsyncMock()
        mock_response.json.return_value = {
            "request_id": "req-501",
            "status": "denied",
        }
        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.post.return_value = mock_response

        sec = Security(mock_client)
        result = await sec.adeny(token="tok-501", reviewer="dave", reason="Not allowed")

        assert isinstance(result, dict)
        assert result["status"] == "denied"


# ---------------------------------------------------------------------------
# Security – get_receipt / aget_receipt
# ---------------------------------------------------------------------------

class TestSecurityGetReceipt:
    def test_get_receipt_returns_json(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "receipt_id": "rcpt-001",
            "action_id": "act-001",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "decision": "permit",
        }
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        sec = Security(mock_client)
        result = sec.get_receipt("rcpt-001")

        assert isinstance(result, dict)
        assert result["receipt_id"] == "rcpt-001"
        mock_client.get.assert_called_once_with("/security/receipts/rcpt-001")

    @pytest.mark.asyncio
    async def test_aget_receipt_returns_json(self):
        mock_response = AsyncMock()
        mock_response.json.return_value = {"receipt_id": "rcpt-002"}
        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.get.return_value = mock_response

        sec = Security(mock_client)
        result = await sec.aget_receipt("rcpt-002")

        assert isinstance(result, dict)
        assert result["receipt_id"] == "rcpt-002"


# ---------------------------------------------------------------------------
# Security – get_session_receipts / aget_session_receipts
# ---------------------------------------------------------------------------

class TestSecurityGetSessionReceipts:
    def test_get_session_receipts_returns_json(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "receipts": [],
            "total": 0,
        }
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        sec = Security(mock_client)
        result = sec.get_session_receipts("sess-abc", limit=50)

        assert isinstance(result, dict)
        mock_client.get.assert_called_once()
        call_kwargs = mock_client.get.call_args
        assert call_kwargs[0][0] == "/security/receipts/session/sess-abc"
        assert call_kwargs[1]["params"]["limit"] == 50

    def test_get_session_receipts_custom_limit(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {"receipts": [], "total": 0}
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        sec = Security(mock_client)
        sec.get_session_receipts("sess-xyz", limit=200)

        call_kwargs = mock_client.get.call_args
        assert call_kwargs[1]["params"]["limit"] == 200

    @pytest.mark.asyncio
    async def test_aget_session_receipts_returns_json(self):
        mock_response = AsyncMock()
        mock_response.json.return_value = {"receipts": [], "total": 0}
        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.get.return_value = mock_response

        sec = Security(mock_client)
        result = await sec.aget_session_receipts("sess-async")

        assert isinstance(result, dict)


# ---------------------------------------------------------------------------
# Security – run_compliance_check / arun_compliance_check
# ---------------------------------------------------------------------------

class TestSecurityRunComplianceCheck:
    def test_run_compliance_check_returns_json(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "compliant": True,
            "checks_passed": 10,
            "checks_failed": 0,
        }
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        sec = Security(mock_client)
        result = sec.run_compliance_check()

        assert isinstance(result, dict)
        assert result["compliant"] is True
        mock_client.get.assert_called_once_with("/security/compliance")

    @pytest.mark.asyncio
    async def test_arun_compliance_check_returns_json(self):
        mock_response = AsyncMock()
        mock_response.json.return_value = {
            "compliant": False,
            "checks_passed": 8,
            "checks_failed": 2,
        }
        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.get.return_value = mock_response

        sec = Security(mock_client)
        result = await sec.arun_compliance_check()

        assert isinstance(result, dict)
        assert result["compliant"] is False


# ---------------------------------------------------------------------------
# Security – get_metrics / aget_metrics
# ---------------------------------------------------------------------------

class TestSecurityGetMetrics:
    def test_get_metrics_returns_governance_metrics(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "total_evaluations": 500,
            "permits": 450,
            "denials": 30,
            "defers": 20,
            "pending_approvals": 5,
            "intent_drifts": 2,
            "active_sessions": 3,
            "avg_latency_ms": 18.5,
            "decisions_per_minute": 12,
            "decisions_per_hour": 720,
        }
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        sec = Security(mock_client)
        result = sec.get_metrics()

        assert isinstance(result, GovernanceMetrics)
        assert result.total_evaluations == 500
        assert result.permits == 450
        assert result.avg_latency_ms == 18.5
        mock_client.get.assert_called_once_with("/security/metrics")

    @pytest.mark.asyncio
    async def test_aget_metrics_returns_governance_metrics(self):
        mock_response = AsyncMock()
        mock_response.json.return_value = {
            "total_evaluations": 1000,
            "permits": 900,
            "denials": 80,
            "defers": 20,
            "pending_approvals": 10,
        }
        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.get.return_value = mock_response

        sec = Security(mock_client)
        result = await sec.aget_metrics()

        assert isinstance(result, GovernanceMetrics)
        assert result.total_evaluations == 1000


# ---------------------------------------------------------------------------
# Security – get_prometheus_metrics / aget_prometheus_metrics
# ---------------------------------------------------------------------------

class TestSecurityGetPrometheusMetrics:
    def test_get_prometheus_metrics_returns_text(self):
        prom_text = "# HELP mutx_governance_decisions_total\nmutx_governance_decisions_total 123\n"
        mock_response = MagicMock()
        mock_response.text = prom_text
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        sec = Security(mock_client)
        result = sec.get_prometheus_metrics()

        assert isinstance(result, str)
        assert "mutx_governance_decisions_total" in result
        mock_client.get.assert_called_once_with("/security/metrics/prometheus")

    @pytest.mark.asyncio
    async def test_aget_prometheus_metrics_returns_text(self):
        prom_text = "# HELP mutx_avg_latency_ms\nmutx_avg_latency_ms 25.0\n"
        mock_response = AsyncMock()
        mock_response.text = prom_text
        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.get.return_value = mock_response

        sec = Security(mock_client)
        result = await sec.aget_prometheus_metrics()

        assert isinstance(result, str)
        assert "mutx_avg_latency_ms" in result


# ---------------------------------------------------------------------------
# Security – create_session / acreate_session
# ---------------------------------------------------------------------------

class TestSecurityCreateSession:
    def test_create_session_returns_json(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "session_id": "sess-001",
            "agent_id": "agent-001",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        sec = Security(mock_client)
        result = sec.create_session(
            session_id="sess-001",
            agent_id="agent-001",
            original_request="List files",
            stated_intent="File listing",
            user_id="user-001",
        )

        assert isinstance(result, dict)
        assert result["session_id"] == "sess-001"
        mock_client.post.assert_called_once()
        call_kwargs = mock_client.post.call_args
        assert call_kwargs[0][0] == "/security/sessions"
        assert call_kwargs[1]["params"]["session_id"] == "sess-001"
        assert call_kwargs[1]["params"]["original_request"] == "List files"

    def test_create_session_minimal(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {"session_id": "sess-002"}
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.post.return_value = mock_response

        sec = Security(mock_client)
        result = sec.create_session(session_id="sess-002", agent_id="agent-002")

        assert isinstance(result, dict)
        call_kwargs = mock_client.post.call_args
        assert call_kwargs[1]["params"]["original_request"] == ""
        assert call_kwargs[1]["params"]["stated_intent"] == ""

    @pytest.mark.asyncio
    async def test_acreate_session_returns_json(self):
        mock_response = AsyncMock()
        mock_response.json.return_value = {"session_id": "sess-003"}
        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.post.return_value = mock_response

        sec = Security(mock_client)
        result = await sec.acreate_session(
            session_id="sess-003",
            agent_id="agent-003",
            original_request="Run test",
        )

        assert isinstance(result, dict)
        assert result["session_id"] == "sess-003"


# ---------------------------------------------------------------------------
# Security – get_session / aget_session
# ---------------------------------------------------------------------------

class TestSecurityGetSession:
    def test_get_session_returns_json(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "session_id": "sess-get-001",
            "agent_id": "agent-001",
            "status": "active",
        }
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.get.return_value = mock_response

        sec = Security(mock_client)
        result = sec.get_session("sess-get-001")

        assert isinstance(result, dict)
        assert result["session_id"] == "sess-get-001"
        mock_client.get.assert_called_once_with("/security/sessions/sess-get-001")

    @pytest.mark.asyncio
    async def test_aget_session_returns_json(self):
        mock_response = AsyncMock()
        mock_response.json.return_value = {"session_id": "sess-get-002"}
        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.get.return_value = mock_response

        sec = Security(mock_client)
        result = await sec.aget_session("sess-get-002")

        assert isinstance(result, dict)
        assert result["session_id"] == "sess-get-002"


# ---------------------------------------------------------------------------
# Security – close_session / aclose_session
# ---------------------------------------------------------------------------

class TestSecurityCloseSession:
    def test_close_session_returns_json(self):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "session_id": "sess-close-001",
            "status": "closed",
        }
        mock_client = MagicMock(spec=httpx.Client)
        mock_client.delete.return_value = mock_response

        sec = Security(mock_client)
        result = sec.close_session("sess-close-001")

        assert isinstance(result, dict)
        assert result["status"] == "closed"
        mock_client.delete.assert_called_once_with("/security/sessions/sess-close-001")

    @pytest.mark.asyncio
    async def test_aclose_session_returns_json(self):
        mock_response = AsyncMock()
        mock_response.json.return_value = {"session_id": "sess-close-002", "status": "closed"}
        mock_client = MagicMock(spec=httpx.AsyncClient)
        mock_client.delete.return_value = mock_response

        sec = Security(mock_client)
        result = await sec.aclose_session("sess-close-002")

        assert isinstance(result, dict)
        assert result["status"] == "closed"


# ---------------------------------------------------------------------------
# Security – method callability checks (parity with other SDK modules)
# ---------------------------------------------------------------------------

class TestSecurityMethodParity:
    """Verify every documented public method is callable on the right client type."""

    @pytest.mark.parametrize(
        "method_name",
        [
            "evaluate_action",
            "request_approval",
            "get_approval",
            "list_pending_approvals",
            "approve",
            "deny",
            "get_receipt",
            "get_session_receipts",
            "run_compliance_check",
            "get_metrics",
            "get_prometheus_metrics",
            "create_session",
            "get_session",
            "close_session",
        ],
    )
    def test_sync_methods_exist(self, method_name):
        client = httpx.Client()
        sec = Security(client)
        assert callable(getattr(sec, method_name)), f"Missing sync method: {method_name}"

    @pytest.mark.parametrize(
        "method_name",
        [
            "aevaluate_action",
            "arequest_approval",
            "aget_approval",
            "alist_pending_approvals",
            "aapprove",
            "adeny",
            "aget_receipt",
            "aget_session_receipts",
            "arun_compliance_check",
            "aget_metrics",
            "aget_prometheus_metrics",
            "acreate_session",
            "aget_session",
            "aclose_session",
        ],
    )
    def test_async_methods_exist(self, method_name):
        client = httpx.AsyncClient()
        sec = Security(client)
        assert callable(getattr(sec, method_name)), f"Missing async method: {method_name}"
