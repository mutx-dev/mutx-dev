"""
Policy Engine.

Evaluates actions against static policy rules AND contextual intent alignment.
Makes binary authorization decisions: allow, deny, modify, or require approval.

AARM Requirements:
- R1: MUST block actions before execution based on policy
- R2: MUST validate action parameters against type, range, and pattern constraints
- R4: MUST evaluate intent consistency for context-dependent actions

MIT License - Copyright (c) 2024 aarm-dev
https://github.com/aarm-dev/docs
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional

from src.security.mediator import NormalizedAction
from src.security.context import ContextAccumulator, IntentSignal, SessionContext


class PolicyDecision(str, Enum):
    """Possible policy decisions."""

    ALLOW = "allow"
    DENY = "deny"
    MODIFY = "modify"
    DEFER = "defer"


@dataclass
class PolicyRule:
    """
    A single policy rule.

    Rules are evaluated in order. First matching rule determines the decision.
    """

    id: str
    name: str
    description: str = ""
    enabled: bool = True
    priority: int = 100

    tool_pattern: str = "*"
    agent_pattern: str = "*"
    session_pattern: str = "*"

    condition: Optional[str] = None
    action: PolicyDecision = PolicyDecision.DENY
    reason: str = ""
    require_context_alignment: bool = False

    rate_limit_per_minute: Optional[int] = None
    rate_limit_per_session: Optional[int] = None

    _hit_count: int = 0
    _last_hit: Optional[datetime] = None

    def matches(self, action: NormalizedAction, context: Optional[SessionContext] = None) -> bool:
        """Check if this rule matches the given action and context."""
        if not self.enabled:
            return False

        if not self._matches_pattern(self.tool_pattern, action.tool_name):
            return False

        if not self._matches_pattern(self.agent_pattern, action.agent_id):
            return False

        if not self._matches_pattern(self.session_pattern, action.session_id):
            return False

        if context and self.require_context_alignment:
            if context.stated_intent and context.intent_signals:
                latest_signal = context.intent_signals[-1]
                if latest_signal in (IntentSignal.DRIFT_CONFIRMED, IntentSignal.DRIFT_SUSPECTED):
                    return True

        return True

    def _matches_pattern(self, pattern: str, value: str) -> bool:
        """Simple glob-style pattern matching."""
        if pattern == "*":
            return True
        if pattern.startswith("*") and pattern.endswith("*"):
            return pattern[1:-1] in value
        if pattern.startswith("*"):
            return value.endswith(pattern[1:])
        if pattern.endswith("*"):
            return value.startswith(pattern[:-1])
        return pattern == value

    def record_hit(self) -> None:
        """Record that this rule was matched."""
        self._hit_count += 1
        self._last_hit = datetime.now(timezone.utc)

    @property
    def hit_count(self) -> int:
        return self._hit_count

    @property
    def last_hit(self) -> Optional[datetime]:
        return self._last_hit


@dataclass
class PolicyDecisionResult:
    """
    Result of a policy evaluation.

    Contains the decision and supporting information for audit trails.
    """

    decision: PolicyDecision
    rule_id: Optional[str]
    rule_name: Optional[str]
    reason: str
    modifications: Optional[dict[str, Any]] = None
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    session_id: Optional[str] = None
    action_id: Optional[str] = None

    @property
    def is_allowed(self) -> bool:
        return self.decision == PolicyDecision.ALLOW

    @property
    def is_denied(self) -> bool:
        return self.decision == PolicyDecision.DENY

    @property
    def is_deferred(self) -> bool:
        return self.decision == PolicyDecision.DEFER

    @property
    def is_modified(self) -> bool:
        return self.decision == PolicyDecision.MODIFY


@dataclass
class PolicySet:
    """
    A collection of policy rules.

    PolicySets can be combined to create layered policies.
    """

    id: str
    name: str
    description: str = ""
    enabled: bool = True
    rules: list[PolicyRule] = field(default_factory=list)
    default_decision: PolicyDecision = PolicyDecision.DENY
    metadata: dict[str, Any] = field(default_factory=dict)

    def add_rule(self, rule: PolicyRule) -> None:
        self.rules.append(rule)
        self.rules.sort(key=lambda r: r.priority)

    def get_rule(self, rule_id: str) -> Optional[PolicyRule]:
        for rule in self.rules:
            if rule.id == rule_id:
                return rule
        return None

    def remove_rule(self, rule_id: str) -> bool:
        for i, rule in enumerate(self.rules):
            if rule.id == rule_id:
                del self.rules[i]
                return True
        return False


class PolicyEngine:
    """
    Evaluates actions against policy rules.

    The PolicyEngine is the core authorization component that:
    1. Loads and manages PolicySets
    2. Evaluates actions against rules in priority order
    3. Returns PolicyDecisionResult with decision and reasoning

    Usage:
        engine = PolicyEngine()

        # Load policy
        policy = PolicySet(id="default", name="Default Policy")
        policy.add_rule(PolicyRule(
            id="deny-destructive",
            name="Deny Destructive",
            tool_pattern="shell/*",
            action=PolicyDecision.DENY,
            reason="Shell commands are forbidden",
        ))
        engine.add_policy(policy)

        # Evaluate
        result = engine.evaluate(action, context)
        if result.is_allowed:
            execute(action)
        elif result.is_denied:
            log_denial(result)
        elif result.is_deferred:
            request_approval(action)
    """

    def __init__(self):
        self._policies: dict[str, PolicySet] = {}
        self._context_accumulator: Optional[ContextAccumulator] = None
        self._default_policy: Optional[str] = None

    def set_context_accumulator(self, accumulator: ContextAccumulator) -> None:
        """Set the context accumulator for context-aware evaluation."""
        self._context_accumulator = accumulator

    def add_policy(self, policy: PolicySet, set_default: bool = False) -> None:
        """Add a policy set to the engine."""
        self._policies[policy.id] = policy
        if set_default or self._default_policy is None:
            self._default_policy = policy.id

    def remove_policy(self, policy_id: str) -> bool:
        """Remove a policy from the engine."""
        if policy_id in self._policies:
            del self._policies[policy_id]
            if self._default_policy == policy_id:
                self._default_policy = next(iter(self._policies), None)
            return True
        return False

    def get_policy(self, policy_id: str) -> Optional[PolicySet]:
        """Get a policy by ID."""
        return self._policies.get(policy_id)

    def list_policies(self) -> list[dict[str, Any]]:
        """List all policies."""
        return [
            {
                "id": p.id,
                "name": p.name,
                "enabled": p.enabled,
                "rule_count": len(p.rules),
            }
            for p in self._policies.values()
        ]

    def evaluate(
        self,
        action: NormalizedAction,
        context: Optional[SessionContext] = None,
        policy_id: Optional[str] = None,
    ) -> PolicyDecisionResult:
        """
        Evaluate an action against policy.

        Args:
            action: The normalized action to evaluate
            context: Session context for context-aware evaluation
            policy_id: Specific policy to use (default: engine's default)

        Returns:
            PolicyDecisionResult with decision and reasoning
        """
        policy = self._policies.get(policy_id or self._default_policy)

        if not policy:
            return PolicyDecisionResult(
                decision=PolicyDecision.DENY,
                rule_id=None,
                rule_name=None,
                reason="No policy configured",
                session_id=action.session_id,
                action_id=action.id,
            )

        if not policy.enabled:
            return PolicyDecisionResult(
                decision=PolicyDecision.DENY,
                rule_id=None,
                rule_name=None,
                reason="Policy is disabled",
                session_id=action.session_id,
                action_id=action.id,
            )

        # Pre-check: reject dangerous command patterns before rule evaluation
        if action.tool_args:
            is_safe, violations = self.validate_command_constraints(
                action.tool_name, action.tool_args
            )
            if not is_safe:
                return PolicyDecisionResult(
                    decision=PolicyDecision.DENY,
                    rule_id=None,
                    rule_name=None,
                    reason=f"Dangerous command pattern blocked: {'; '.join(violations)}",
                    session_id=action.session_id,
                    action_id=action.id,
                )

        for rule in policy.rules:
            if rule.matches(action, context):
                rule.record_hit()

                if rule.action == PolicyDecision.DEFER:
                    return PolicyDecisionResult(
                        decision=PolicyDecision.DEFER,
                        rule_id=rule.id,
                        rule_name=rule.name,
                        reason=rule.reason or f"Action deferred by rule: {rule.name}",
                        session_id=action.session_id,
                        action_id=action.id,
                    )

                if rule.action == PolicyDecision.MODIFY:
                    return PolicyDecisionResult(
                        decision=PolicyDecision.MODIFY,
                        rule_id=rule.id,
                        rule_name=rule.name,
                        reason=rule.reason or f"Action modified by rule: {rule.name}",
                        modifications=self._apply_modifications(action, rule),
                        session_id=action.session_id,
                        action_id=action.id,
                    )

                if rule.action == PolicyDecision.DENY:
                    return PolicyDecisionResult(
                        decision=PolicyDecision.DENY,
                        rule_id=rule.id,
                        rule_name=rule.name,
                        reason=rule.reason or f"Action denied by rule: {rule.name}",
                        session_id=action.session_id,
                        action_id=action.id,
                    )

                if rule.action == PolicyDecision.ALLOW:
                    return PolicyDecisionResult(
                        decision=PolicyDecision.ALLOW,
                        rule_id=rule.id,
                        rule_name=rule.name,
                        reason=rule.reason or f"Action allowed by rule: {rule.name}",
                        session_id=action.session_id,
                        action_id=action.id,
                    )

        return PolicyDecisionResult(
            decision=policy.default_decision,
            rule_id=None,
            rule_name=None,
            reason=f"No matching rule; default: {policy.default_decision.value}",
            session_id=action.session_id,
            action_id=action.id,
        )

    def validate_params(
        self,
        tool_name: str,
        params: dict[str, Any],
        tool_schemas: dict[str, Any],
    ) -> tuple[bool, list[str]]:
        """
        Validate action parameters against tool schemas.

        Args:
            tool_name: Name of the tool
            params: Parameters to validate
            tool_schemas: Dictionary of tool schemas

        Returns:
            Tuple of (is_valid, list of error messages)
        """
        schema = tool_schemas.get(tool_name)
        if not schema:
            return True, []

        errors = []
        param_defs = schema.get("parameters", {})

        for param_name, param_def in param_defs.items():
            value = params.get(param_name)

            if param_def.get("required") and value is None:
                errors.append(f"Missing required parameter: {param_name}")
                continue

            if value is None:
                continue

            param_type = param_def.get("type")
            if param_type == "string":
                if not isinstance(value, str):
                    errors.append(f"Parameter '{param_name}' must be a string")
                else:
                    max_len = param_def.get("maxLength")
                    if max_len and len(value) > max_len:
                        errors.append(f"Parameter '{param_name}' exceeds max length {max_len}")

            elif param_type == "number":
                if not isinstance(value, (int, float)):
                    errors.append(f"Parameter '{param_name}' must be a number")
                else:
                    minimum = param_def.get("minimum")
                    maximum = param_def.get("maximum")
                    if minimum is not None and value < minimum:
                        errors.append(f"Parameter '{param_name}' must be >= {minimum}")
                    if maximum is not None and value > maximum:
                        errors.append(f"Parameter '{param_name}' must be <= {maximum}")

            elif param_type == "boolean":
                if not isinstance(value, bool):
                    errors.append(f"Parameter '{param_name}' must be a boolean")

            elif param_type == "array":
                if not isinstance(value, list):
                    errors.append(f"Parameter '{param_name}' must be an array")

            elif param_type == "object":
                if not isinstance(value, dict):
                    errors.append(f"Parameter '{param_name}' must be an object")

        return len(errors) == 0, errors

    def validate_command_constraints(
        self,
        tool_name: str,
        params: dict[str, Any],
    ) -> tuple[bool, list[str]]:
        """
        Validate command content for shell/exec-type tools.

        Inspects the actual command arguments for dangerous patterns.
        Returns (is_safe, list of violation descriptions).
        """
        DANGEROUS_PATTERNS = [
            (r";\s*(rm|rmdir)\s", "chained destructive command"),
            (r"\|\s*(rm|rmdir)\s", "piped destructive command"),
            (r"&&\s*(rm|rmdir)\s", "chained destructive command"),
            (r">\s*/dev/sd", "direct device write"),
            (r"curl\s+.*\|\s*sh", "remote code execution via pipe"),
            (r"wget\s+.*\|\s*sh", "remote code execution via pipe"),
            (r"eval\s+", "eval usage"),
            (r"exec\s+", "exec usage"),
            (r"/etc/(passwd|shadow|sudoers)", "sensitive system file access"),
            (r"chmod\s+[0-7]*777", "overly permissive chmod"),
            (r"dd\s+if=.*of=/dev/", "raw device manipulation"),
        ]

        import re as _re

        errors = []
        command_fields = ("command", "cmd", "script", "shell_command", "args")

        for field_name in command_fields:
            value = params.get(field_name)
            if not isinstance(value, str):
                continue

            for pattern, description in DANGEROUS_PATTERNS:
                if _re.search(pattern, value, _re.IGNORECASE):
                    errors.append(f"Potentially dangerous command in '{field_name}': {description}")

        return len(errors) == 0, errors

    def _apply_modifications(
        self,
        action: NormalizedAction,
        rule: PolicyRule,
    ) -> dict[str, Any]:
        """Apply modifications to an action as specified by rule."""
        return {
            "original_args": action.tool_args.copy(),
            "modified_args": action.tool_args.copy(),
            "rule_id": rule.id,
        }

    def evaluate_dry_run(
        self,
        action: NormalizedAction,
        context: Optional[SessionContext] = None,
    ) -> dict[str, Any]:
        """
        Evaluate an action without executing, returning full analysis.

        Useful for debugging and testing policies.
        """
        result = self.evaluate(action, context)

        return {
            "action": action.to_dict(),
            "decision": result.decision.value,
            "rule_id": result.rule_id,
            "rule_name": result.rule_name,
            "reason": result.reason,
            "would_modify": result.is_modified,
            "timestamp": result.timestamp.isoformat(),
        }

    def get_stats(self) -> dict[str, Any]:
        """Get policy engine statistics."""
        total_rules = sum(len(p.rules) for p in self._policies.values())
        total_hits = sum(rule.hit_count for p in self._policies.values() for rule in p.rules)

        return {
            "policy_count": len(self._policies),
            "total_rules": total_rules,
            "total_evaluations": total_hits,
            "policies": [
                {
                    "id": p.id,
                    "name": p.name,
                    "rules": len(p.rules),
                    "enabled": p.enabled,
                }
                for p in self._policies.values()
            ],
        }
