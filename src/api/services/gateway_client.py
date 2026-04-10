"""Gateway client for calling OpenClaw gateway methods."""

import json
import subprocess
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)


class GovernanceError(Exception):
    """Raised when governance blocks a tool call."""

    def __init__(self, tool_id: str, reason: str, reason_code: str | None = None):
        self.tool_id = tool_id
        self.reason = reason
        self.reason_code = reason_code
        super().__init__(f"Tool {tool_id} blocked: {reason}")


def _parse_gateway_json_output(raw: str) -> Any:
    """Parse JSON from gateway CLI output."""
    trimmed = raw.strip()
    if not trimmed:
        return None

    # Find JSON start position
    object_start = trimmed.find("{")
    array_start = trimmed.find("[")
    has_object = object_start >= 0
    has_array = array_start >= 0

    start = -1
    end = -1

    if has_object and has_array:
        if object_start < array_start:
            start = object_start
            end = trimmed.rfind("}")
        else:
            start = array_start
            end = trimmed.rfind("]")
    elif has_object:
        start = object_start
        end = trimmed.rfind("}")
    elif has_array:
        start = array_start
        end = trimmed.rfind("]")

    if start < 0 or end < start:
        return None

    try:
        return json.loads(trimmed[start : end + 1])
    except json.JSONDecodeError:
        return None


def _run_openclaw(args: list, timeout_ms: int = 10000) -> subprocess.CompletedProcess:
    """Run OpenClaw CLI command."""
    cmd = ["openclaw"] + args
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout_ms / 1000,
        )
        return result
    except subprocess.TimeoutExpired:
        raise TimeoutError(f"OpenClaw command timed out: {' '.join(cmd)}")
    except FileNotFoundError:
        raise RuntimeError("OpenClaw CLI not found. Is it installed?")


async def call_gateway_method(
    method: str,
    params: Optional[dict] = None,
    timeout_ms: int = 10000,
) -> Any:
    """
    Call an OpenClaw gateway method via CLI.

    Args:
        method: Gateway method name
        params: Method parameters dict
        timeout_ms: Timeout in milliseconds

    Returns:
        Parsed JSON response from gateway

    Raises:
        TimeoutError: If command times out
        RuntimeError: If OpenClaw CLI not found or invalid response
    """
    params = params or {}
    timeout = max(1000, int(timeout_ms))

    cmd = [
        "gateway",
        "call",
        method,
        "--timeout",
        str(timeout),
        "--params",
        json.dumps(params),
        "--json",
    ]

    result = _run_openclaw(cmd, timeout_ms=timeout_ms + 2000)

    payload = _parse_gateway_json_output(result.stdout)
    if payload is None:
        raise RuntimeError(f"Invalid JSON response from gateway method {method}")

    return payload


# Sync version for non-async contexts
def call_gateway_method_sync(
    method: str,
    params: Optional[dict] = None,
    timeout_ms: int = 10000,
) -> Any:
    """Synchronous version of call_gateway_method."""
    import asyncio

    async def _call():
        return await call_gateway_method(method, params, timeout_ms)

    return asyncio.get_event_loop().run_until_complete(_call())


async def call_gateway_method_governed(
    method: str,
    params: Optional[dict] = None,
    agent_id: str | None = None,
    governance_enabled: bool = True,
    timeout_ms: int = 10000,
) -> Any:
    """
    Call an OpenClaw gateway method with governance pre-check.

    Args:
        method: Gateway method name
        params: Method parameters dict
        agent_id: Agent ID for governance context
        governance_enabled: Whether to check governance
        timeout_ms: Timeout in milliseconds

    Returns:
        Parsed JSON response from gateway

    Raises:
        GovernanceError: If governance blocks the tool call
        TimeoutError: If command times out
        RuntimeError: If OpenClaw CLI not found or invalid response
    """
    if governance_enabled and agent_id:
        try:
            from cli.faramesh_runtime import gate_decide
        except ImportError:
            governance_enabled = False

        if governance_enabled:
            decision = gate_decide(
                agent_id=agent_id,
                tool_id=method,
                params=params or {},
            )
            if decision.outcome == "HALT" or decision.effect == "DEFER":
                raise GovernanceError(
                    tool_id=method,
                    reason=decision.reason or "denied or deferred by policy",
                    reason_code=decision.reason_code,
                )

    return await call_gateway_method(method, params, timeout_ms)


def call_gateway_method_sync_governed(
    method: str,
    params: Optional[dict] = None,
    agent_id: str | None = None,
    governance_enabled: bool = True,
    timeout_ms: int = 10000,
) -> Any:
    """Synchronous version of call_gateway_method_governed."""
    import asyncio

    async def _call():
        return await call_gateway_method_governed(
            method, params, agent_id, governance_enabled, timeout_ms
        )

    return asyncio.get_event_loop().run_until_complete(_call())


__all__ = [
    "call_gateway_method",
    "call_gateway_method_sync",
    "call_gateway_method_governed",
    "call_gateway_method_sync_governed",
    "GovernanceError",
]
