"""
Action Mediation Layer.

Intercepts tool invocations and normalizes them to a canonical schema,
enabling policy evaluation against a consistent format.

AARM Requirement: R1 (MUST block actions before execution based on policy)

The ActionMediator is the entry point for all tool calls in the MUTX security layer.
It normalizes any tool invocation to a canonical NormalizedAction format that the
PolicyEngine can evaluate consistently.

MIT License - Copyright (c) 2024 aarm-dev
https://github.com/aarm-dev/docs
"""

import hashlib
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional


class ActionCategory(str, Enum):
    """
    Classification of an action based on static policy evaluation.

    Three categories recognize that security decisions aren't binary:
    """

    FORBIDDEN = "forbidden"
    CONTEXT_DEPENDENT_DENY = "context_dependent_deny"
    CONTEXT_DEPENDENT_ALLOW = "context_dependent_allow"
    PERMIT = "permit"


@dataclass
class NormalizedAction:
    """
    Canonical representation of any tool invocation.

    NormalizedAction is the key abstraction that enables MUTX to evaluate
    any tool call from any framework (OpenClaw, LangChain, AutoGen, etc.)
    through a single policy interface.
    """

    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    tool_name: str = ""
    tool_args: dict[str, Any] = field(default_factory=dict)
    agent_id: str = ""
    session_id: str = ""
    user_id: str = ""
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    trigger: str = "manual"
    runtime: str = "mutx"
    raw_action: Any = None
    input_preview: Optional[str] = None
    output_preview: Optional[str] = None
    parent_action_id: Optional[str] = None

    @property
    def action_hash(self) -> str:
        """Generate a unique hash of this action for deduplication."""
        canonical = (
            f"{self.tool_name}:{self.agent_id}:{self.session_id}:{self.timestamp.isoformat()}"
        )
        return hashlib.sha256(canonical.encode()).hexdigest()[:16]

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "tool_name": self.tool_name,
            "tool_args": self.tool_args,
            "agent_id": self.agent_id,
            "session_id": self.session_id,
            "user_id": self.user_id,
            "timestamp": self.timestamp.isoformat(),
            "trigger": self.trigger,
            "runtime": self.runtime,
            "action_hash": self.action_hash,
        }


@dataclass
class ParameterConstraint:
    """Constraint for validating a single parameter."""

    name: str
    type: str  # "string", "number", "boolean", "array", "object"
    required: bool = False
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    max_length: Optional[int] = None
    pattern: Optional[str] = None
    allowed_values: Optional[list[str]] = None
    description: str = ""


@dataclass
class ToolSchema:
    """Schema definition for a tool's parameters."""

    tool_name: str
    description: str = ""
    parameters: list[ParameterConstraint] = field(default_factory=list)
    category: str = "general"
    risk_level: str = "low"
    requires_approval: bool = False
    approval_timeout_seconds: int = 300


class ActionMediator:
    """
    Intercepts and normalizes tool invocations.

    The ActionMediator is responsible for:
    1. Receiving raw tool invocations from any framework
    2. Normalizing them to the canonical NormalizedAction format
    3. Optionally validating parameters against ToolSchema
    4. Passing normalized actions to the PolicyEngine for evaluation

    Usage:
        mediator = ActionMediator()

        # Register tool schemas
        mediator.register_tool(ToolSchema(
            tool_name="send_email",
            parameters=[
                ParameterConstraint(name="to", type="string", required=True),
                ParameterConstraint(name="subject", type="string", max_length=200),
            ],
            risk_level="high",
            requires_approval=True,
        ))

        # Intercept a tool call
        action = mediator.intercept(
            tool_name="send_email",
            tool_args={"to": "user@example.com", "subject": "Hello"},
            agent_id="agent-123",
            session_id="session-456",
        )

        # Get static category (without context)
        category = mediator.categorize(action)
    """

    def __init__(self):
        self._tool_schemas: dict[str, ToolSchema] = {}
        self._interceptors: list[callable] = []

    def register_tool(self, schema: ToolSchema) -> None:
        """Register a tool schema for parameter validation."""
        self._tool_schemas[schema.tool_name] = schema

    def register_interceptor(self, interceptor: callable) -> None:
        """Register an interceptor function called on every action."""
        self._interceptors.append(interceptor)

    def intercept(
        self,
        tool_name: str,
        tool_args: dict[str, Any],
        agent_id: str,
        session_id: str,
        user_id: str = "",
        trigger: str = "manual",
        runtime: str = "mutx",
        raw_action: Any = None,
        parent_action_id: Optional[str] = None,
    ) -> NormalizedAction:
        """
        Normalize a tool invocation to canonical format.

        Args:
            tool_name: Name of the tool being called
            tool_args: Arguments passed to the tool
            agent_id: ID of the agent making the call
            session_id: ID of the session
            user_id: ID of the user (if applicable)
            trigger: What triggered this call (manual, cron, agent, etc.)
            runtime: Runtime identifier
            raw_action: Original action object (for debugging)
            parent_action_id: ID of parent action if this is a sub-action

        Returns:
            NormalizedAction in canonical format
        """
        action = NormalizedAction(
            id=str(uuid.uuid4()),
            tool_name=tool_name,
            tool_args=tool_args,
            agent_id=agent_id,
            session_id=session_id,
            user_id=user_id,
            timestamp=datetime.now(timezone.utc),
            trigger=trigger,
            runtime=runtime,
            raw_action=raw_action,
            parent_action_id=parent_action_id,
        )

        if tool_args:
            first_arg_preview = str(list(tool_args.values())[0])[:100]
            action.input_preview = first_arg_preview

        for interceptor in self._interceptors:
            try:
                result = interceptor(action)
                if result is not None:
                    action = result
            except Exception:
                pass

        return action

    def validate_parameters(self, tool_name: str, params: dict[str, Any]) -> tuple[bool, list[str]]:
        """
        Validate tool parameters against registered schema.

        Args:
            tool_name: Name of the tool
            params: Parameters to validate

        Returns:
            Tuple of (is_valid, list of error messages)
        """
        schema = self._tool_schemas.get(tool_name)
        if not schema:
            return True, []

        errors = []
        for constraint in schema.parameters:
            value = params.get(constraint.name)

            if constraint.required and value is None:
                errors.append(f"Missing required parameter: {constraint.name}")
                continue

            if value is None:
                continue

            if not self._validate_type(constraint.type, value):
                errors.append(f"Parameter '{constraint.name}' must be of type {constraint.type}")
                continue

            if constraint.type == "string":
                if constraint.max_length and len(value) > constraint.max_length:
                    errors.append(
                        f"Parameter '{constraint.name}' exceeds max length {constraint.max_length}"
                    )
                if constraint.pattern and not self._matches_pattern(constraint.pattern, value):
                    errors.append(
                        f"Parameter '{constraint.name}' does not match pattern {constraint.pattern}"
                    )
                if constraint.allowed_values and value not in constraint.allowed_values:
                    errors.append(
                        f"Parameter '{constraint.name}' must be one of {constraint.allowed_values}"
                    )

            elif constraint.type == "number":
                if constraint.min_value is not None and value < constraint.min_value:
                    errors.append(
                        f"Parameter '{constraint.name}' must be >= {constraint.min_value}"
                    )
                if constraint.max_value is not None and value > constraint.max_value:
                    errors.append(
                        f"Parameter '{constraint.name}' must be <= {constraint.max_value}"
                    )

        return len(errors) == 0, errors

    def _validate_type(self, expected_type: str, value: Any) -> bool:
        """Check if value matches expected type."""
        if expected_type == "string":
            return isinstance(value, str)
        elif expected_type == "number":
            return isinstance(value, (int, float))
        elif expected_type == "boolean":
            return isinstance(value, bool)
        elif expected_type == "array":
            return isinstance(value, list)
        elif expected_type == "object":
            return isinstance(value, dict)
        return True

    def _matches_pattern(self, pattern: str, value: str) -> bool:
        """Check if string matches regex pattern."""
        import re

        try:
            return bool(re.match(pattern, value))
        except re.error:
            return True

    def categorize(self, action: NormalizedAction) -> ActionCategory:
        """
        Get static category for an action (without context evaluation).

        This is a quick categorization based on tool risk level and
        whether the tool is registered. For full evaluation with context,
        use PolicyEngine.evaluate().
        """
        schema = self._tool_schemas.get(action.tool_name)

        if schema:
            if schema.risk_level == "critical":
                return ActionCategory.FORBIDDEN
            if schema.requires_approval:
                return ActionCategory.CONTEXT_DEPENDENT_ALLOW

        return ActionCategory.PERMIT

    def get_tool_schema(self, tool_name: str) -> Optional[ToolSchema]:
        """Get the registered schema for a tool."""
        return self._tool_schemas.get(tool_name)
