from __future__ import annotations

import json
import os
import shutil
import socket
import subprocess
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

FAREMESH_PROVIDER_ID = "faramesh"
FAREMESH_SOCKET_PATH = "/tmp/faramesh.sock"
FAREMESH_DEFAULT_DAEMON_PORT = 7777
FAREMESH_INSTALL_URL = "https://raw.githubusercontent.com/faramesh/faramesh-core/main/install.sh"


@dataclass
class FarameshDaemonHealth:
    daemon_reachable: bool = False
    socket_reachable: bool = False
    policy_loaded: bool = False
    policy_name: str | None = None
    policy_path: str | None = None
    decisions_total: int = 0
    pending_approvals: int = 0
    denied_today: int = 0
    deferred_today: int = 0
    uptime_seconds: float = 0.0
    version: str | None = None
    doctor_summary: str | None = None


@dataclass
class FarameshDecision:
    effect: str | None = None
    agent_id: str | None = None
    tool_id: str | None = None
    rule_id: str | None = None
    reason_code: str | None = None
    defer_token: str | None = None
    latency_ms: int | None = None
    timestamp: str | None = None


@dataclass
class FarameshDeferItem:
    defer_token: str | None = None
    agent_id: str | None = None
    tool_id: str | None = None
    status: str | None = None
    reason: str | None = None


@dataclass
class FarameshSnapshot:
    provider: str = FAREMESH_PROVIDER_ID
    status: str = "unknown"
    version: str | None = None
    decisions_total: int = 0
    permits_today: int = 0
    denies_today: int = 0
    defers_today: int = 0
    pending_approvals: int = 0
    last_decision_at: str | None = None
    observed_at: str | None = None
    payload: dict | None = None


def is_socket_reachable(socket_path: str = FAREMESH_SOCKET_PATH, timeout: float = 0.5) -> bool:
    try:
        if not os.path.exists(socket_path):
            return False
        sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        sock.connect(socket_path)
        sock.close()
        return True
    except (OSError, socket.error, socket.timeout):
        return False


def _send_socket_request(socket_path: str, request: dict, timeout: float = 5.0) -> list[dict]:
    try:
        sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        sock.connect(socket_path)
    except (OSError, socket.error):
        return []

    try:
        sock.sendall((json.dumps(request) + "\n").encode("utf-8"))
        sock.shutdown(socket.SHUT_WR)

        buf = b""
        while True:
            try:
                chunk = sock.recv(4096)
            except socket.timeout:
                break
            if not chunk:
                break
            buf += chunk

        if not buf:
            return []

        results = []
        for line in buf.decode("utf-8").splitlines():
            line = line.strip()
            if line:
                try:
                    results.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
        return results
    finally:
        try:
            sock.close()
        except Exception:
            pass


def get_daemon_status(socket_path: str = FAREMESH_SOCKET_PATH) -> dict:
    result = _send_socket_request(socket_path, {"type": "audit_subscribe"})
    subscribed = len(result) > 0 and any(r.get("subscribed") for r in result)
    return {"reachable": bool(result), "subscribed": subscribed}


def get_recent_decisions(
    socket_path: str = FAREMESH_SOCKET_PATH, limit: int = 50
) -> list[FarameshDecision]:
    result = _send_socket_request(socket_path, {"type": "decisions_recent", "limit": limit})
    decisions = []
    for item in result:
        decisions.append(
            FarameshDecision(
                effect=item.get("effect"),
                agent_id=item.get("agent_id"),
                tool_id=item.get("tool_id"),
                rule_id=item.get("rule_id"),
                reason_code=item.get("reason_code"),
                defer_token=item.get("defer_token"),
                latency_ms=item.get("latency_ms"),
                timestamp=item.get("timestamp"),
            )
        )
    return decisions


def get_pending_defers(socket_path: str = FAREMESH_SOCKET_PATH) -> list[FarameshDeferItem]:
    result = _send_socket_request(socket_path, {"type": "defers_pending"})
    defers = []
    for item in result:
        defers.append(
            FarameshDeferItem(
                defer_token=item.get("defer_token"),
                agent_id=item.get("agent_id"),
                tool_id=item.get("tool_id"),
                status=item.get("status"),
                reason=item.get("reason"),
            )
        )
    return defers


def find_faramesh_bin() -> str | None:
    bin_path = shutil.which("faramesh")
    if bin_path:
        return bin_path
    local_bin = Path.home() / ".local" / "bin" / "faramesh"
    if local_bin.exists():
        return str(local_bin)
    return None


def detect_faramesh_version() -> str | None:
    bin_path = find_faramesh_bin()
    if not bin_path:
        return None
    try:
        result = subprocess.run(
            [bin_path, "version"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if result.returncode == 0:
            return result.stdout.strip()
        return None
    except (OSError, subprocess.SubprocessError, subprocess.TimeoutExpired):
        return None


def is_faramesh_installed() -> bool:
    return find_faramesh_bin() is not None


def is_faramesh_available() -> bool:
    return is_socket_reachable()


def ensure_faramesh_installed(
    install_if_missing: bool = True, non_interactive: bool = True
) -> tuple[bool, str | None]:
    if is_faramesh_installed():
        return True, find_faramesh_bin()

    if not install_if_missing:
        return False, None

    try:
        install_script_path = Path("/tmp/faramesh_install.sh")
        subprocess.run(
            ["curl", "-fsSL", FAREMESH_INSTALL_URL, "-o", str(install_script_path)],
            check=True,
            timeout=30,
        )
        subprocess.run(
            ["chmod", "+x", str(install_script_path)],
            check=True,
            timeout=5,
        )

        cmd = [str(install_script_path), "--install-dir", str(Path.home() / ".local" / "bin")]
        if non_interactive:
            cmd.append("--no-interactive")

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120,
        )

        if result.returncode == 0:
            bin_path = find_faramesh_bin()
            return True, bin_path
        else:
            return False, result.stderr if result.stderr else result.stdout
    except (OSError, subprocess.SubprocessError, subprocess.TimeoutExpired) as e:
        return False, str(e)


def _count_decisions_by_effect(decisions: list) -> tuple:
    permit_count = 0
    deny_count = 0
    defer_count = 0

    for decision in decisions:
        effect = getattr(decision, "effect", None)
        if effect is None:
            continue
        effect_lower = effect.lower()
        if effect_lower == "permit":
            permit_count += 1
        elif effect_lower == "deny":
            deny_count += 1
        elif effect_lower == "defer":
            defer_count += 1

    return permit_count, deny_count, defer_count


def collect_faramesh_snapshot() -> FarameshSnapshot:
    health = get_faramesh_health()
    decisions = get_recent_decisions()
    pending_defers = get_pending_defers()

    permit_count, deny_count, defer_count = _count_decisions_by_effect(decisions)

    last_decision_at = None
    if decisions:
        for d in reversed(decisions):
            ts = getattr(d, "timestamp", None)
            if ts:
                last_decision_at = ts
                break

    status = "not_installed"
    if health.socket_reachable and health.daemon_reachable:
        status = "running"
    elif health.socket_reachable:
        status = "degraded"
    elif find_faramesh_bin():
        status = "stopped"

    payload = {
        "provider": "faramesh",
        "role": "governance",
        "decisions_total": len(decisions),
        "permits_today": permit_count,
        "denies_today": deny_count,
        "defers_today": defer_count,
        "pending_approvals": len(pending_defers),
        "last_decision_at": last_decision_at,
    }

    return FarameshSnapshot(
        provider="faramesh",
        status=status,
        version=health.version,
        decisions_total=len(decisions),
        permits_today=permit_count,
        denies_today=deny_count,
        defers_today=defer_count,
        pending_approvals=len(pending_defers),
        last_decision_at=last_decision_at,
        observed_at=datetime.now(timezone.utc).isoformat(),
        payload=payload,
    )


def get_faramesh_health() -> FarameshDaemonHealth:
    health = FarameshDaemonHealth()

    bin_path = find_faramesh_bin()
    health.version = detect_faramesh_version() if bin_path else None
    health.socket_reachable = is_socket_reachable()

    if not bin_path:
        health.doctor_summary = "Faramesh is not installed."
        return health

    if not health.socket_reachable:
        health.doctor_summary = "Faramesh is installed but the daemon is not running."
        return health

    if health.socket_reachable:
        status = get_daemon_status()
        health.daemon_reachable = status.get("reachable", False)

        if health.daemon_reachable:
            health.doctor_summary = "Faramesh governance daemon is running and reachable."
            try:
                decisions = get_recent_decisions(limit=100)
                health.decisions_total = len(decisions)
                _, denied, deferred = _count_decisions_by_effect(decisions)
                health.denied_today = denied
                health.deferred_today = deferred
            except Exception:
                pass

            try:
                pending = get_pending_defers()
                health.pending_approvals = len(pending)
            except Exception:
                pass
        else:
            health.doctor_summary = (
                "Faramesh daemon socket is reachable but not responding correctly."
            )
    else:
        health.doctor_summary = "Faramesh is installed but the daemon is not running."

    return health


def start_faramesh_daemon(
    policy_path: str | None = None, socket_path: str = FAREMESH_SOCKET_PATH
) -> subprocess.Popen | None:
    bin_path = find_faramesh_bin()
    if not bin_path:
        return None

    cmd = [bin_path, "serve"]

    if policy_path:
        cmd.extend(["--policy", policy_path])

    cmd.extend(["--socket", socket_path])

    try:
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )

        time.sleep(0.5)

        if proc.poll() is not None:
            return None

        return proc
    except (OSError, subprocess.SubprocessError):
        return None


def install_faramesh(non_interactive: bool = True) -> str:
    success, result = ensure_faramesh_installed(
        install_if_missing=True, non_interactive=non_interactive
    )

    if success:
        return result if result else "installed"
    else:
        raise Exception(f"Faramesh installation failed: {result}")
