from __future__ import annotations

import json
import os
import shutil
import socket
import subprocess
import threading
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx


FAREMESH_PROVIDER_ID = "faramesh"
FAREMESH_SOCKET_PATH = "/tmp/faramesh.sock"
FAREMESH_DEFAULT_DAEMON_PORT = 7777
FAREMESH_INSTALL_URL = "https://raw.githubusercontent.com/faramesh/faramesh-core/main/install.sh"


@dataclass(slots=True)
class FarameshDaemonHealth:
    daemon_reachable: bool
    socket_reachable: bool
    policy_loaded: bool
    policy_name: str | None
    policy_path: str | None
    decisions_total: int
    pending_approvals: int
    denied_today: int
    deferred_today: int
    uptime_seconds: int | None
    version: str | None
    doctor_summary: str


@dataclass(slots=True)
class FarameshDecision:
    effect: str
    agent_id: str
    tool_id: str
    rule_id: str | None
    reason_code: str | None
    defer_token: str | None
    latency_ms: int
    timestamp: str | None


@dataclass(slots=True)
class FarameshDeferItem:
    defer_token: str
    agent_id: str
    tool_id: str
    reason: str | None
    status: str
    created_at: str | None


@dataclass(slots=True)
class FarameshSnapshot:
    provider: str = FAREMESH_PROVIDER_ID
    status: str = "disconnected"
    daemon_reachable: bool = False
    socket_reachable: bool = False
    policy_name: str | None = None
    policy_path: str | None = None
    decisions_total: int = 0
    pending_approvals: int = 0
    denied_today: int = 0
    deferred_today: int = 0
    uptime_seconds: int | None = None
    version: str | None = None
    payload: dict[str, Any] = field(default_factory=dict)

    def to_payload(self) -> dict[str, Any]:
        return dict(self.payload)


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def _format_age_seconds(timestamp_ms: int | None) -> str:
    if not timestamp_ms:
        return "-"
    diff = time.time() * 1000 - timestamp_ms
    if diff <= 0:
        return "now"
    mins = int(diff / 60000)
    hours = int(mins / 60)
    days = int(hours / 24)
    if days > 0:
        return f"{days}d"
    if hours > 0:
        return f"{hours}h"
    return f"{mins}m"


def find_faramesh_bin() -> str | None:
    resolved = shutil.which("faramesh")
    if resolved:
        return resolved
    candidates = [
        Path("/opt/homebrew/bin/faramesh"),
        Path("/usr/local/bin/faramesh"),
        Path.home() / ".local" / "bin" / "faramesh",
    ]
    for candidate in candidates:
        if candidate.exists() and os.access(candidate, os.X_OK):
            return str(candidate)
    return None


def detect_faramesh_version() -> str | None:
    bin_path = find_faramesh_bin()
    if bin_path is None:
        return None
    try:
        result = subprocess.run(
            [bin_path, "--version"],
            check=False,
            capture_output=True,
            text=True,
            timeout=5,
        )
    except OSError:
        return None
    output = (result.stdout or result.stderr or "").strip()
    if not output:
        return None
    first_line = output.splitlines()[0].strip()
    if first_line.lower().startswith("faramesh"):
        return first_line
    return f"faramesh {first_line}"


def is_socket_reachable(socket_path: str = FAREMESH_SOCKET_PATH, timeout: float = 0.5) -> bool:
    if not os.path.exists(socket_path):
        return False
    try:
        sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        sock.connect(socket_path)
        sock.close()
        return True
    except (OSError, socket.timeout):
        return False


def _send_socket_request(
    socket_path: str, request: dict[str, Any], timeout: float = 5.0
) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    if not os.path.exists(socket_path):
        return results

    try:
        sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        sock.connect(socket_path)
        sock.sendall((json.dumps(request) + "\n").encode("utf-8"))
        sock.shutdown(socket.SHUT_WR)

        buf = b""
        while True:
            chunk = sock.recv(4096)
            if not chunk:
                break
            buf += chunk
        sock.close()

        for line in buf.decode("utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                results.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    except (OSError, socket.timeout, socket.error):
        pass
    return results


def get_daemon_status(socket_path: str = FAREMESH_SOCKET_PATH) -> dict[str, Any]:
    request = {"type": "audit_subscribe"}
    responses = _send_socket_request(socket_path, request, timeout=2.0)
    if not responses:
        return {"reachable": False, "subscribed": False}
    first = responses[0] if responses else {}
    return {"reachable": True, "subscribed": first.get("subscribed", False)}


def get_recent_decisions(
    socket_path: str = FAREMESH_SOCKET_PATH, limit: int = 50
) -> list[FarameshDecision]:
    decisions: list[FarameshDecision] = []
    request = {"type": "audit_subscribe"}
    responses = _send_socket_request(socket_path, request, timeout=3.0)

    for resp in responses[:limit]:
        if not isinstance(resp, dict):
            continue
        effect = str(resp.get("effect", ""))
        if not effect:
            continue
        decisions.append(
            FarameshDecision(
                effect=effect,
                agent_id=str(resp.get("agent_id") or ""),
                tool_id=str(resp.get("tool_id") or ""),
                rule_id=resp.get("rule_id"),
                reason_code=resp.get("reason_code"),
                defer_token=resp.get("defer_token"),
                latency_ms=int(resp.get("latency_ms") or 0),
                timestamp=None,
            )
        )
    return decisions


def get_pending_defers(socket_path: str = FAREMESH_SOCKET_PATH) -> list[FarameshDeferItem]:
    defer_items: list[FarameshDeferItem] = []
    request = {"type": "poll_defer", "agent_id": "", "defer_token": ""}
    responses = _send_socket_request(socket_path, request, timeout=3.0)

    for resp in responses:
        if not isinstance(resp, dict):
            continue
        defer_token = resp.get("defer_token", "")
        if not defer_token:
            continue
        defer_items.append(
            FarameshDeferItem(
                defer_token=str(defer_token),
                agent_id=str(resp.get("agent_id") or ""),
                tool_id=str(resp.get("tool_id") or ""),
                reason=resp.get("reason"),
                status=str(resp.get("status", "pending")),
                created_at=resp.get("created_at"),
            )
        )
    return defer_items


def _count_decisions_by_effect(decisions: list[FarameshDecision]) -> tuple[int, int, int]:
    permit = deny = defer = 0
    for d in decisions:
        if d.effect == "PERMIT":
            permit += 1
        elif d.effect == "DENY":
            deny += 1
        elif d.effect == "DEFER":
            defer += 1
    return permit, deny, defer


def get_faramesh_health() -> FarameshDaemonHealth:
    bin_path = find_faramesh_bin()
    installed = bin_path is not None
    version = detect_faramesh_version() if installed else None
    socket_reachable = is_socket_reachable()

    daemon_reachable = False
    policy_loaded = False
    policy_name = None
    policy_path = None
    decisions_total = 0
    pending_approvals = 0
    denied_today = 0
    deferred_today = 0
    uptime_seconds = None
    doctor_summary = ""

    if socket_reachable:
        try:
            status = get_daemon_status()
            daemon_reachable = status.get("reachable", False)
        except Exception:
            daemon_reachable = False

    if not installed:
        doctor_summary = (
            "Faramesh is not installed. Install it with:\n"
            "  curl -fsSL https://raw.githubusercontent.com/faramesh/faramesh-core/main/install.sh | bash\n"
            "Or: brew install faramesh/tap/faramesh"
        )
    elif not socket_reachable:
        doctor_summary = (
            "Faramesh is installed but the daemon is not running.\n"
            "Start it with: faramesh serve --policy policy.yaml\n"
            "See https://faramesh.dev/docs for documentation."
        )
    elif not daemon_reachable:
        doctor_summary = "Faramesh daemon socket is reachable but not responding correctly."
    else:
        doctor_summary = "Faramesh governance daemon is running and reachable."
        policy_loaded = True
        try:
            recent = get_recent_decisions(limit=100)
            _, denied_today, deferred_today = _count_decisions_by_effect(recent)
            decisions_total = len(recent)
            pending_defers = get_pending_defers()
            pending_approvals = len(pending_defers)
        except Exception:
            pass

    return FarameshDaemonHealth(
        daemon_reachable=daemon_reachable,
        socket_reachable=socket_reachable,
        policy_loaded=policy_loaded,
        policy_name=policy_name,
        policy_path=policy_path,
        decisions_total=decisions_total,
        pending_approvals=pending_approvals,
        denied_today=denied_today,
        deferred_today=deferred_today,
        uptime_seconds=uptime_seconds,
        version=version,
        doctor_summary=doctor_summary,
    )


def collect_faramesh_snapshot() -> FarameshSnapshot:
    health = get_faramesh_health()
    observed_at = _utcnow()

    if health.socket_reachable and health.daemon_reachable:
        status = "running"
    elif health.socket_reachable:
        status = "degraded"
    elif find_faramesh_bin():
        status = "stopped"
    else:
        status = "not_installed"

    payload = {
        "provider": FAREMESH_PROVIDER_ID,
        "runtime_key": FAREMESH_PROVIDER_ID,
        "label": "Faramesh",
        "cue": "\U0001f6e1",
        "provider_root": str(Path.home() / ".mutx" / "providers" / FAREMESH_PROVIDER_ID),
        "role": "governance",
        "status": status,
        "daemon_reachable": health.daemon_reachable,
        "socket_reachable": health.socket_reachable,
        "policy_name": health.policy_name,
        "policy_path": health.policy_path,
        "policy_loaded": health.policy_loaded,
        "decisions_total": health.decisions_total,
        "pending_approvals": health.pending_approvals,
        "denied_today": health.denied_today,
        "deferred_today": health.deferred_today,
        "uptime_seconds": health.uptime_seconds,
        "version": health.version,
        "doctor_summary": health.doctor_summary,
        "last_seen_at": observed_at,
        "observed_source": "local",
    }

    return FarameshSnapshot(
        provider=FAREMESH_PROVIDER_ID,
        status=status,
        daemon_reachable=health.daemon_reachable,
        socket_reachable=health.socket_reachable,
        policy_name=health.policy_name,
        policy_path=health.policy_path,
        decisions_total=health.decisions_total,
        pending_approvals=health.pending_approvals,
        denied_today=health.denied_today,
        deferred_today=health.deferred_today,
        uptime_seconds=health.uptime_seconds,
        version=health.version,
        payload=payload,
    )


def is_faramesh_available() -> bool:
    return is_socket_reachable()


def install_faramesh(non_interactive: bool = True) -> str:
    command = f"curl -fsSL {FAREMESH_INSTALL_URL} | bash"
    if non_interactive:
        command += " --fast"
    result = subprocess.run(
        ["bash", "-c", command],
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise Exception(f"Faramesh install failed: {result.stderr}")
    resolved = find_faramesh_bin()
    if resolved:
        return resolved
    raise Exception("Faramesh installed but binary not found on PATH.")
