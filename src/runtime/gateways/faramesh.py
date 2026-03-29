"""
Faramesh Gateway - Faramesh as AARM Implementation.

Use Faramesh as the AARM-compliant policy enforcement backend.
Faramesh provides deterministic policy evaluation via FPL (Faramesh Policy Language).

https://github.com/faramesh/faramesh-core

Faramesh integration provides:
- Deterministic FPL policy evaluation
- Pre-execution blocking of tool calls
- Human approval (DEFER) workflows
- Credential broker for API key management
- Cryptographic decision audit trail

MIT License - Copyright (c) 2024 faramesh
https://github.com/faramesh/faramesh-core/blob/main/LICENSE
"""

import json
import logging
import socket
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional

logger = logging.getLogger(__name__)


FAREMESH_SOCKET_PATH = "/tmp/faramesh.sock"
FAREMESH_DEFAULT_DAEMON_PORT = 7777
FAREMESH_INSTALL_URL = "https://raw.githubusercontent.com/faramesh/faramesh-core/main/install.sh"


class FarameshDecision(str, Enum):
    """Faramesh decision effects."""

    PERMIT = "PERMIT"
    DENY = "DENY"
    DEFER = "DEFER"


@dataclass
class FarameshAction:
    """Action to submit to Faramesh for evaluation."""

    tool_id: str
    agent_id: str
    session_id: str
    tool_args: dict[str, Any] = field(default_factory=dict)
    input_preview: Optional[str] = None


@dataclass
class FarameshResponse:
    """Response from Faramesh daemon."""

    effect: str
    tool_id: str
    agent_id: str
    rule_id: Optional[str] = None
    reason: str = ""
    latency_ms: Optional[int] = None
    defer_token: Optional[str] = None
    timestamp: Optional[str] = None

    @property
    def decision(self) -> FarameshDecision:
        return FarameshDecision(self.effect)


@dataclass
class FarameshHealth:
    """Faramesh daemon health status."""

    socket_reachable: bool = False
    daemon_reachable: bool = False
    version: Optional[str] = None
    policy_name: Optional[str] = None
    decisions_total: int = 0
    denied_today: int = 0
    deferred_today: int = 0
    pending_approvals: int = 0


def _send_socket_request(socket_path: str, request: dict, timeout: float = 5.0) -> list[dict]:
    """Send a request to the Faramesh Unix socket."""
    try:
        sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        sock.connect(socket_path)

        sock.sendall((json.dumps(request) + "\n").encode())
        sock.shutdown(socket.SHUT_WR)

        response_data = b""
        while True:
            chunk = sock.recv(4096)
            if not chunk:
                break
            response_data += chunk

        sock.close()

        if not response_data:
            return []

        try:
            responses = []
            for line in response_data.decode().splitlines():
                if line.strip():
                    responses.append(json.loads(line))
            return responses
        except json.JSONDecodeError:
            return [{"raw": response_data.decode()}]

    except (socket.error, socket.timeout, ConnectionRefusedError) as e:
        logger.debug(f"Faramesh socket error: {e}")
        return []


class FarameshGateway:
    """
    Faramesh as AARM-compliant policy enforcement backend.

    The FarameshGateway wraps the Faramesh daemon to provide
    AARM-compliant governance for MUTX.

    Usage:
        gateway = FarameshGateway()

        # Evaluate an action
        result = await gateway.evaluate_action(
            tool_id="send_email",
            agent_id="agent-123",
            session_id="session-456",
            tool_args={"to": "user@example.com"},
        )

        if result.decision == FarameshDecision.PERMIT:
            execute(action)
        elif result.decision == FarameshDecision.DENY:
            blocked()
        elif result.decision == FarameshDecision.DEFER:
            await request_approval(result.defer_token)
    """

    def __init__(
        self,
        socket_path: str = FAREMESH_SOCKET_PATH,
        daemon_port: int = FAREMESH_DEFAULT_DAEMON_PORT,
    ):
        self._socket_path = socket_path
        self._daemon_port = daemon_port
        self._installed = False
        self._version: Optional[str] = None

    @property
    def is_available(self) -> bool:
        """Check if Faramesh daemon is available."""
        return self._check_socket() and self._check_daemon()

    def _check_socket(self) -> bool:
        """Check if socket file exists."""
        try:
            sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
            sock.settimeout(0.5)
            sock.connect(self._socket_path)
            sock.close()
            return True
        except (socket.error, ConnectionRefusedError):
            return False

    def _check_daemon(self) -> bool:
        """Check if daemon is responding."""
        responses = _send_socket_request(self._socket_path, {"type": "ping"}, timeout=1.0)
        return len(responses) > 0

    def get_health(self) -> FarameshHealth:
        """Get Faramesh daemon health status."""
        health = FarameshHealth()

        health.socket_reachable = self._check_socket()

        if health.socket_reachable:
            responses = _send_socket_request(
                self._socket_path,
                {"type": "status"},
                timeout=2.0,
            )

            for resp in responses:
                if isinstance(resp, dict):
                    health.daemon_reachable = True
                    health.version = resp.get("version")
                    health.policy_name = resp.get("policy_name")
                    health.decisions_total = resp.get("decisions_total", 0)
                    health.denied_today = resp.get("denied_today", 0)
                    health.deferred_today = resp.get("deferred_today", 0)
                    health.pending_approvals = resp.get("pending_approvals", 0)

        return health

    async def evaluate_action(
        self,
        tool_id: str,
        agent_id: str,
        session_id: str,
        tool_args: Optional[dict[str, Any]] = None,
    ) -> Optional[FarameshResponse]:
        """
        Evaluate an action through Faramesh.

        Args:
            tool_id: Name/ID of the tool being called
            agent_id: Agent making the call
            session_id: Session context
            tool_args: Tool arguments

        Returns:
            FarameshResponse with decision or None if unavailable
        """
        if not self.is_available:
            logger.warning("Faramesh daemon not available")
            return None

        action = FarameshAction(
            tool_id=tool_id,
            agent_id=agent_id,
            session_id=session_id,
            tool_args=tool_args or {},
        )

        request = {
            "type": "evaluate",
            "tool_id": action.tool_id,
            "agent_id": action.agent_id,
            "session_id": action.session_id,
            "tool_args": action.tool_args,
        }

        start_time = time.time()
        responses = _send_socket_request(self._socket_path, request, timeout=5.0)
        latency_ms = int((time.time() - start_time) * 1000)

        for resp in responses:
            if isinstance(resp, dict) and resp.get("effect"):
                return FarameshResponse(
                    effect=resp.get("effect", "DENY"),
                    tool_id=resp.get("tool_id", tool_id),
                    agent_id=resp.get("agent_id", agent_id),
                    rule_id=resp.get("rule_id"),
                    reason=resp.get("reason", ""),
                    latency_ms=latency_ms,
                    defer_token=resp.get("defer_token"),
                    timestamp=resp.get("timestamp"),
                )

        return None

    async def approve(self, defer_token: str) -> bool:
        """
        Approve a deferred action.

        Args:
            defer_token: Token from DEFER response

        Returns:
            True if approved successfully
        """
        request = {
            "type": "approve",
            "defer_token": defer_token,
        }

        responses = _send_socket_request(self._socket_path, request, timeout=5.0)

        for resp in responses:
            if isinstance(resp, dict):
                return resp.get("approved", False)

        return False

    async def deny(self, defer_token: str, reason: str = "") -> bool:
        """
        Deny a deferred action.

        Args:
            defer_token: Token from DEFER response
            reason: Reason for denial

        Returns:
            True if denied successfully
        """
        request = {
            "type": "deny",
            "defer_token": defer_token,
            "reason": reason,
        }

        responses = _send_socket_request(self._socket_path, request, timeout=5.0)

        for resp in responses:
            if isinstance(resp, dict):
                return resp.get("denied", False)

        return False

    def get_recent_decisions(self, limit: int = 50) -> list[FarameshResponse]:
        """
        Get recent governance decisions.

        Args:
            limit: Maximum number of decisions to return

        Returns:
            List of recent FarameshResponse objects
        """
        request = {
            "type": "audit_tail",
            "limit": limit,
        }

        responses = _send_socket_request(self._socket_path, request, timeout=5.0)

        decisions = []
        for resp in responses:
            if isinstance(resp, dict) and resp.get("effect"):
                decisions.append(
                    FarameshResponse(
                        effect=resp.get("effect", "DENY"),
                        tool_id=resp.get("tool_id", ""),
                        agent_id=resp.get("agent_id", ""),
                        rule_id=resp.get("rule_id"),
                        reason=resp.get("reason", ""),
                        latency_ms=resp.get("latency_ms"),
                        defer_token=resp.get("defer_token"),
                        timestamp=resp.get("timestamp"),
                    )
                )

        return decisions

    def get_pending_approvals(self) -> list[dict]:
        """
        Get pending approval requests.

        Returns:
            List of pending defer items
        """
        request = {"type": "pending"}

        responses = _send_socket_request(self._socket_path, request, timeout=5.0)

        pending = []
        for resp in responses:
            if isinstance(resp, dict) and resp.get("defer_token"):
                pending.append(resp)

        return pending

    def install(self, non_interactive: bool = True) -> tuple[bool, Optional[str]]:
        """
        Install Faramesh if not present.

        Args:
            non_interactive: Run without user prompts

        Returns:
            Tuple of (success, bin_path)
        """
        import subprocess

        try:
            result = subprocess.run(
                ["curl", "-fsSL", FAREMESH_INSTALL_URL],
                capture_output=True,
                text=True,
                timeout=30,
            )

            if result.returncode != 0:
                return False, None

            install_script = result.stdout

            cmd = ["bash", "-c", install_script]
            if non_interactive:
                cmd = ["bash", "-c", install_script + " --non-interactive"]

            install_result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60,
            )

            if install_result.returncode == 0:
                self._installed = True
                bin_path = self._find_bin()
                return True, bin_path

            return False, None

        except Exception as e:
            logger.error(f"Faramesh install failed: {e}")
            return False, None

    def _find_bin(self) -> Optional[str]:
        """Find the faramesh binary."""
        import shutil

        if shutil.which("faramesh"):
            return shutil.which("faramesh")

        for path in ["/usr/local/bin/faramesh", "/usr/bin/faramesh"]:
            import os

            if os.path.exists(path):
                return path

        return None

    def is_installed(self) -> bool:
        """Check if Faramesh is installed."""
        return self._find_bin() is not None


_gateway: Optional[FarameshGateway] = None


def get_faramesh_gateway() -> FarameshGateway:
    """Get the global FarameshGateway instance."""
    global _gateway
    if _gateway is None:
        _gateway = FarameshGateway()
    return _gateway
