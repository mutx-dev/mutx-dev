"""
Context Accumulator.

Tracks session state throughout an agent's execution:
- User's original request
- Prior actions executed
- Data accessed
- Tool outputs
- Intermediate model responses

AARM Requirement: R3 (MUST accumulate session context including prior actions)
AARM Requirement: R4 (MUST evaluate intent consistency for context-dependent actions)

The ContextAccumulator builds a picture of the ongoing session to enable
context-aware policy evaluation. An action that looks fine in isolation might
be a breach in context.

MIT License - Copyright (c) 2024 aarm-dev
https://github.com/aarm-dev/docs
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

from src.security.mediator import NormalizedAction


class IntentSignal(str, Enum):
    """Signal indicating alignment with stated intent."""

    ALIGNED = "aligned"
    DRIFT_SUSPECTED = "drift_suspected"
    DRIFT_CONFIRMED = "drift_confirmed"
    UNKNOWN = "unknown"


@dataclass
class ActionRecord:
    """Record of an action that has been evaluated and executed."""

    id: str
    tool_name: str
    tool_args: dict[str, Any]
    action_hash: str
    timestamp: datetime
    effect: str
    decision_reason: str = ""
    output_preview: Optional[str] = None
    error: Optional[str] = None


@dataclass
class DataAccess:
    """Record of data accessed during a session."""

    resource_type: str
    resource_id: str
    access_time: datetime
    access_type: str
    sensitive: bool = False


@dataclass
class SessionContext:
    """
    Complete context for an agent session.

    The SessionContext accumulates all relevant state throughout a session,
    enabling the PolicyEngine to make context-aware decisions.
    """

    session_id: str
    agent_id: str
    user_id: str = ""
    workspace_id: str = ""
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    original_request: str = ""
    stated_intent: str = ""
    intent_signals: list[IntentSignal] = field(default_factory=list)

    actions: list[ActionRecord] = field(default_factory=list)
    data_accessed: list[DataAccess] = field(default_factory=list)

    tool_call_count: int = 0
    error_count: int = 0
    denied_count: int = 0

    last_action_timestamp: Optional[datetime] = None
    last_action_tool: Optional[str] = None

    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def action_hashes(self) -> list[str]:
        """Get list of all action hashes for provenance."""
        return [a.action_hash for a in self.actions]

    @property
    def recent_tool_sequence(self) -> list[str]:
        """Get recent tool names in order."""
        return [a.tool_name for a in self.actions[-10:]]

    @property
    def session_duration_seconds(self) -> float:
        """Get session duration in seconds."""
        delta = self.updated_at - self.created_at
        return delta.total_seconds()

    def to_dict(self) -> dict[str, Any]:
        return {
            "session_id": self.session_id,
            "agent_id": self.agent_id,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat(),
            "actions": [
                {
                    "id": a.id,
                    "tool_name": a.tool_name,
                    "action_hash": a.action_hash,
                    "timestamp": a.timestamp.isoformat(),
                    "effect": a.effect,
                }
                for a in self.actions
            ],
            "intent_signals": [s.value for s in self.intent_signals],
            "tool_call_count": self.tool_call_count,
            "error_count": self.error_count,
            "denied_count": self.denied_count,
        }


class ContextAccumulator:
    """
    Accumulates and manages session context.

    The ContextAccumulator maintains SessionContext for each active session
    and provides methods to query context for policy evaluation.

    Usage:
        accumulator = ContextAccumulator()

        # Start tracking a session
        context = accumulator.create_session(
            session_id="session-123",
            agent_id="agent-456",
            user_id="user-789",
            original_request="Please send an email to john@example.com",
        )

        # Record an action
        accumulator.record_action(
            session_id="session-123",
            action=normalized_action,
            effect="PERMIT",
        )

        # Get context for evaluation
        context = accumulator.get_context("session-123")
        is_aligned = accumulator.evaluate_intent(context)
    """

    def __init__(self):
        self._sessions: dict[str, SessionContext] = {}
        self._max_history: int = 1000

    def create_session(
        self,
        session_id: str,
        agent_id: str,
        user_id: str = "",
        workspace_id: str = "",
        original_request: str = "",
        stated_intent: str = "",
        metadata: Optional[dict[str, Any]] = None,
    ) -> SessionContext:
        """
        Create a new session context.

        Args:
            session_id: Unique session identifier
            agent_id: Agent ID
            user_id: User ID (if applicable)
            workspace_id: Workspace/tenant ID
            original_request: The original user request
            stated_intent: User's stated goal
            metadata: Additional session metadata

        Returns:
            The created SessionContext
        """
        context = SessionContext(
            session_id=session_id,
            agent_id=agent_id,
            user_id=user_id,
            workspace_id=workspace_id,
            original_request=original_request,
            stated_intent=stated_intent,
            metadata=metadata or {},
        )
        self._sessions[session_id] = context
        return context

    def get_context(self, session_id: str) -> Optional[SessionContext]:
        """Get context for a session."""
        return self._sessions.get(session_id)

    def record_action(
        self,
        session_id: str,
        action: NormalizedAction,
        effect: str,
        decision_reason: str = "",
        output_preview: Optional[str] = None,
        error: Optional[str] = None,
    ) -> Optional[SessionContext]:
        """
        Record an action in the session context.

        Args:
            session_id: Session to record in
            action: The normalized action
            effect: Decision effect (PERMIT, DENY, DEFER)
            decision_reason: Why the decision was made
            output_preview: Truncated output
            error: Error message if failed

        Returns:
            Updated SessionContext or None if session not found
        """
        context = self._sessions.get(session_id)
        if not context:
            return None

        record = ActionRecord(
            id=action.id,
            tool_name=action.tool_name,
            tool_args=action.tool_args,
            action_hash=action.action_hash,
            timestamp=action.timestamp,
            effect=effect,
            decision_reason=decision_reason,
            output_preview=output_preview,
            error=error,
        )

        context.actions.append(record)
        context.updated_at = datetime.now(timezone.utc)
        context.last_action_timestamp = action.timestamp
        context.last_action_tool = action.tool_name

        if effect == "DENY":
            context.denied_count += 1
        elif effect == "PERMIT":
            context.tool_call_count += 1

        if error:
            context.error_count += 1

        self._prune_history(session_id)

        return context

    def record_data_access(
        self,
        session_id: str,
        resource_type: str,
        resource_id: str,
        access_type: str = "read",
        sensitive: bool = False,
    ) -> Optional[SessionContext]:
        """Record data access in the session context."""
        context = self._sessions.get(session_id)
        if not context:
            return None

        access = DataAccess(
            resource_type=resource_type,
            resource_id=resource_id,
            access_time=datetime.now(timezone.utc),
            access_type=access_type,
            sensitive=sensitive,
        )
        context.data_accessed.append(access)

        return context

    def evaluate_intent(self, context: SessionContext) -> IntentSignal:
        """
        Evaluate whether agent behavior aligns with stated intent.

        Args:
            context: Session context to evaluate

        Returns:
            IntentSignal indicating alignment
        """
        if not context.stated_intent:
            return IntentSignal.UNKNOWN

        drift_score = self._compute_drift_score(context)
        if drift_score > 0.7:
            context.intent_signals.append(IntentSignal.DRIFT_CONFIRMED)
            return IntentSignal.DRIFT_CONFIRMED
        elif drift_score > 0.4:
            context.intent_signals.append(IntentSignal.DRIFT_SUSPECTED)
            return IntentSignal.DRIFT_SUSPECTED

        context.intent_signals.append(IntentSignal.ALIGNED)
        return IntentSignal.ALIGNED

    def _compute_drift_score(self, context: SessionContext) -> float:
        """
        Compute a drift score 0-1 indicating how much behavior has drifted.

        Factors:
        - Repeated denials suggest agent trying workarounds
        - Error rate suggests confusion or misalignment
        - Tool sequence patterns
        """
        if not context.actions:
            return 0.0

        denial_rate = context.denied_count / len(context.actions)
        error_rate = context.error_count / len(context.actions)

        tool_repetition = self._compute_repetition(context.recent_tool_sequence)

        drift = denial_rate * 0.4 + error_rate * 0.3 + tool_repetition * 0.3

        return min(1.0, drift)

    def _compute_repetition(self, tool_sequence: list[str]) -> float:
        """Compute how repetitive the tool sequence is (0=no repetition, 1=highly repetitive)."""
        if len(tool_sequence) < 3:
            return 0.0

        unique_tools = len(set(tool_sequence))
        total_tools = len(tool_sequence)

        if unique_tools == total_tools:
            return 0.0

        return 1.0 - (unique_tools / total_tools)

    def record_intent_signal(self, session_id: str, signal: IntentSignal, reason: str = "") -> None:
        """Manually record an intent signal."""
        context = self._sessions.get(session_id)
        if context:
            context.intent_signals.append(signal)

    def close_session(self, session_id: str) -> Optional[SessionContext]:
        """Close and return final context for a session."""
        context = self._sessions.pop(session_id, None)
        return context

    def get_session_summary(self, session_id: str) -> Optional[dict[str, Any]]:
        """Get a summary of session state."""
        context = self._sessions.get(session_id)
        if not context:
            return None

        return {
            "session_id": context.session_id,
            "agent_id": context.agent_id,
            "duration_seconds": context.session_duration_seconds,
            "total_actions": len(context.actions),
            "permits": sum(1 for a in context.actions if a.effect == "PERMIT"),
            "denials": sum(1 for a in context.actions if a.effect == "DENY"),
            "defers": sum(1 for a in context.actions if a.effect == "DEFER"),
            "errors": context.error_count,
            "intent_alignment": (
                context.intent_signals[-1].value if context.intent_signals else "unknown"
            ),
        }

    def _prune_history(self, session_id: str) -> None:
        """Prune old history if over max."""
        context = self._sessions.get(session_id)
        if context and len(context.actions) > self._max_history:
            context.actions = context.actions[-self._max_history :]

    def list_active_sessions(self) -> list[str]:
        """List IDs of all active sessions."""
        return list(self._sessions.keys())
