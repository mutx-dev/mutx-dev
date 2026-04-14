"""
Observability and Security API service for CLI and TUI.

Provides access to MUTX Observability Schema (MutxRun, MutxStep, etc.)
and AARM Security Layer (evaluations, approvals, receipts, compliance).
"""

from __future__ import annotations

from typing import Any

from cli.services.base import APIService


class ObservabilityService(APIService):
    """Service for MUTX Observability API."""

    def list_runs(
        self,
        agent_id: str | None = None,
        status: str | None = None,
        limit: int = 50,
        skip: int = 0,
    ) -> list[dict[str, Any]]:
        """List agent runs with optional filters."""
        params = {"limit": limit, "skip": skip}
        if agent_id:
            params["agent_id"] = agent_id
        if status:
            params["status"] = status

        response = self._request("GET", "/v1/observability/runs", params=params)
        self._expect_status(response, {200})
        data = response.json()
        return data.get("items", [])

    def get_run(self, run_id: str) -> dict[str, Any]:
        """Get a specific run with steps and cost."""
        response = self._request("GET", f"/v1/observability/runs/{run_id}")
        self._expect_status(response, {200})
        return response.json()

    def create_run(self, run_data: dict[str, Any]) -> dict[str, Any]:
        """Create a new agent run."""
        response = self._request("POST", "/v1/observability/runs", json=run_data)
        self._expect_status(response, {201})
        return response.json()

    def add_steps(self, run_id: str, steps: list[dict[str, Any]]) -> dict[str, Any]:
        """Add steps to an existing run.

        Args:
            run_id: The run ID to add steps to.
            steps: List of step dicts. Each dict must have a "type" field.

        Returns:
            Dict with 'total' (total steps in run) and 'added' (steps in this batch).
        """
        response = self._request("POST", f"/v1/observability/runs/{run_id}/steps", json=steps)
        self._expect_status(response, {201})
        return response.json()

    def update_status(self, run_id: str, status: str, **kwargs) -> dict[str, Any]:
        """Update run status."""
        data = {"status": status, **kwargs}
        response = self._request("PATCH", f"/v1/observability/runs/{run_id}/status", json=data)
        self._expect_status(response, {200})
        return response.json()

    def get_eval(self, run_id: str) -> dict[str, Any] | None:
        """Get evaluation for a run."""
        response = self._request("GET", f"/v1/observability/runs/{run_id}/eval")
        if response.status_code == 404:
            return None
        self._expect_status(response, {200})
        return response.json()

    def submit_eval(self, run_id: str, eval_data: dict[str, Any]) -> dict[str, Any]:
        """Submit an evaluation for a run."""
        response = self._request("POST", f"/v1/observability/runs/{run_id}/eval", json=eval_data)
        self._expect_status(response, {201})
        return response.json()

    def get_provenance(self, run_id: str) -> dict[str, Any] | None:
        """Get provenance for a run."""
        response = self._request("GET", f"/v1/observability/runs/{run_id}/provenance")
        if response.status_code == 404:
            return None
        self._expect_status(response, {200})
        return response.json()


class SecurityService(APIService):
    """Service for MUTX AARM Security API."""

    def evaluate_action(
        self,
        tool_name: str,
        tool_args: dict[str, Any],
        agent_id: str,
        session_id: str,
    ) -> dict[str, Any]:
        """Evaluate an action against policy (dry-run)."""
        data = {
            "tool_name": tool_name,
            "tool_args": tool_args,
            "agent_id": agent_id,
            "session_id": session_id,
        }
        response = self._request("POST", "/v1/security/actions/evaluate", json=data)
        self._expect_status(response, {200})
        return response.json()

    def get_compliance_report(self) -> dict[str, Any]:
        """Run AARM conformance checks."""
        response = self._request("GET", "/v1/security/compliance")
        self._expect_status(response, {200})
        return response.json()

    def get_metrics(self) -> dict[str, Any]:
        """Get governance metrics."""
        response = self._request("GET", "/v1/security/metrics")
        self._expect_status(response, {200})
        return response.json()

    def get_prometheus_metrics(self) -> str:
        """Get metrics in Prometheus format."""
        response = self._request("GET", "/v1/security/metrics/prometheus")
        self._expect_status(response, {200})
        return response.text

    def list_approvals(self) -> list[dict[str, Any]]:
        """List pending approval requests."""
        response = self._request("GET", "/v1/security/approvals")
        self._expect_status(response, {200})
        return response.json()

    def get_approval(self, request_id: str) -> dict[str, Any]:
        """Get a specific approval request."""
        response = self._request("GET", f"/v1/security/approvals/{request_id}")
        self._expect_status(response, {200})
        return response.json()

    def request_approval(
        self,
        tool_name: str,
        tool_args: dict[str, Any],
        agent_id: str,
        session_id: str,
        reason: str = "",
    ) -> dict[str, Any]:
        """Request human approval for an action."""
        data = {
            "tool_name": tool_name,
            "tool_args": tool_args,
            "agent_id": agent_id,
            "session_id": session_id,
            "reason": reason,
        }
        response = self._request("POST", "/v1/security/approvals/request", json=data)
        self._expect_status(response, {201})
        return response.json()

    def approve_request(self, token: str, reviewer: str, comment: str = "") -> dict[str, Any]:
        """Approve a pending request."""
        data = {"reviewer": reviewer, "comment": comment}
        response = self._request("POST", f"/v1/security/approvals/{token}/approve", json=data)
        self._expect_status(response, {200})
        return response.json()

    def deny_request(self, token: str, reviewer: str, comment: str = "") -> dict[str, Any]:
        """Deny a pending request."""
        data = {"reviewer": reviewer, "comment": comment}
        response = self._request("POST", f"/v1/security/approvals/{token}/deny", json=data)
        self._expect_status(response, {200})
        return response.json()

    def get_receipt(self, receipt_id: str) -> dict[str, Any]:
        """Get an action receipt."""
        response = self._request("GET", f"/v1/security/receipts/{receipt_id}")
        self._expect_status(response, {200})
        return response.json()

    def get_session_receipts(self, session_id: str, limit: int = 100) -> list[dict[str, Any]]:
        """Get receipts for a session."""
        response = self._request("GET", f"/v1/security/receipts/session/{session_id}")
        self._expect_status(response, {200})
        data = response.json()
        return data.get("receipts", [])

    def create_session(
        self,
        session_id: str,
        agent_id: str,
        original_request: str = "",
        stated_intent: str = "",
    ) -> dict[str, Any]:
        """Create a new session context."""
        params = {
            "session_id": session_id,
            "agent_id": agent_id,
            "original_request": original_request,
            "stated_intent": stated_intent,
        }
        response = self._request("POST", "/v1/security/sessions", params=params)
        self._expect_status(response, {200})
        return response.json()

    def get_session(self, session_id: str) -> dict[str, Any]:
        """Get session context."""
        response = self._request("GET", f"/v1/security/sessions/{session_id}")
        self._expect_status(response, {200})
        return response.json()

    def close_session(self, session_id: str) -> dict[str, Any]:
        """Close a session."""
        response = self._request("DELETE", f"/v1/security/sessions/{session_id}")
        self._expect_status(response, {200})
        return response.json()
