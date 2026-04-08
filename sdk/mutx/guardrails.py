"""Guardrails middleware for MUTX agent runtime.

This module provides guardrail implementations for content filtering,
PII detection, toxicity detection, and custom regex-based blocking.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Literal, Protocol

import httpx


@dataclass
class GuardrailResult:
    """Result of a guardrail check.

    Attributes:
        passed: Whether the check passed.
        triggered_rule: Name of the rule that triggered (if any).
        action: Action taken - "block", "allow", or "warn".
        message: Human-readable message describing the result.
    """

    passed: bool
    triggered_rule: str | None
    action: Literal["block", "allow", "warn"]
    message: str


class InputGuardrail(Protocol):
    """Protocol for input guardrails that check text before LLM processing."""

    def check(self, text: str, context: dict[str, Any]) -> GuardrailResult:
        """Check input text against guardrail rules.

        Args:
            text: The input text to check.
            context: Additional context for the check.

        Returns:
            GuardrailResult with the check outcome.
        """
        ...


class OutputGuardrail(Protocol):
    """Protocol for output guardrails that check text after LLM generation."""

    def check(self, text: str, context: dict[str, Any]) -> GuardrailResult:
        """Check output text against guardrail rules.

        Args:
            text: The output text to check.
            context: Additional context for the check.

        Returns:
            GuardrailResult with the check outcome.
        """
        ...


class PIIBlocklistGuardrail:
    """Guardrail that blocks text containing PII patterns.

    Detects:
    - Social Security Numbers (SSN)
    - Credit card numbers
    - Email addresses
    """

    SSN_PATTERN = r"\b\d{3}-\d{2}-\d{4}\b"
    CREDIT_CARD_PATTERN = r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b"
    EMAIL_PATTERN = r"\b[\w.-]+@[\w.-]+\.\w+\b"

    def __init__(self):
        self.ssn_regex = re.compile(self.SSN_PATTERN)
        self.credit_card_regex = re.compile(self.CREDIT_CARD_PATTERN)
        self.email_regex = re.compile(self.EMAIL_PATTERN)

    def check(self, text: str, context: dict[str, Any]) -> GuardrailResult:
        """Check text for PII patterns.

        Args:
            text: The text to check.
            context: Additional context (unused).

        Returns:
            GuardrailResult with block action if PII found, allow otherwise.
        """
        if self.ssn_regex.search(text):
            return GuardrailResult(
                passed=False,
                triggered_rule="ssn_block",
                action="block",
                message="Social Security Number detected in text",
            )

        if self.credit_card_regex.search(text):
            return GuardrailResult(
                passed=False,
                triggered_rule="credit_card_block",
                action="block",
                message="Credit card number detected in text",
            )

        if self.email_regex.search(text):
            return GuardrailResult(
                passed=False,
                triggered_rule="email_block",
                action="block",
                message="Email address detected in text",
            )

        return GuardrailResult(
            passed=True,
            triggered_rule=None,
            action="allow",
            message="No PII detected",
        )


class RegexBlocklistGuardrail:
    """Guardrail that blocks text matching any of a list of regex patterns."""

    def __init__(self, patterns: list[str]):
        """Initialize with a list of regex patterns.

        Args:
            patterns: List of regex pattern strings to block on match.
        """
        self.patterns = [re.compile(p) for p in patterns]
        self._pattern_names = [f"regex_block_{i}" for i in range(len(patterns))]

    def check(self, text: str, context: dict[str, Any]) -> GuardrailResult:
        """Check text against all configured regex patterns.

        Args:
            text: The text to check.
            context: Additional context (unused).

        Returns:
            GuardrailResult with block action if any pattern matches, allow otherwise.
        """
        for i, pattern in enumerate(self.patterns):
            match = pattern.search(text)
            if match:
                return GuardrailResult(
                    passed=False,
                    triggered_rule=self._pattern_names[i],
                    action="block",
                    message=f"Text matched blocked pattern: {pattern.pattern}",
                )

        return GuardrailResult(
            passed=True,
            triggered_rule=None,
            action="allow",
            message="No blocked patterns detected",
        )


class ToxicityGuardrail:
    """Guardrail for toxicity detection via external API.

    If toxicity_api_url is not configured, returns allow.
    This is a stub implementation that can be extended to call
    a real toxicity detection service.
    """

    def __init__(self, toxicity_api_url: str | None = None):
        """Initialize toxicity guardrail.

        Args:
            toxicity_api_url: Optional URL for toxicity detection API.
                              If None, all checks return allow.
        """
        self.toxicity_api_url = toxicity_api_url

    def check(self, text: str, context: dict[str, Any]) -> GuardrailResult:
        """Check text for toxicity.

        Args:
            text: The text to check.
            context: Additional context (unused).

        Returns:
            GuardrailResult with allow if no API configured, otherwise
            stub returns allow for future implementation.
        """
        if not self.toxicity_api_url:
            return GuardrailResult(
                passed=True,
                triggered_rule=None,
                action="allow",
                message="Toxicity check not configured, allowing",
            )

        # Stub implementation - in production, this would call the API
        # For now, return allow since this is a stub
        return GuardrailResult(
            passed=True,
            triggered_rule=None,
            action="allow",
            message="Toxicity check passed",
        )

    async def acheck(self, text: str, context: dict[str, Any]) -> GuardrailResult:
        """Async version of toxicity check.

        Args:
            text: The text to check.
            context: Additional context.

        Returns:
            GuardrailResult with allow if no API configured.
        """
        if not self.toxicity_api_url:
            return GuardrailResult(
                passed=True,
                triggered_rule=None,
                action="allow",
                message="Toxicity check not configured, allowing",
            )

        # Stub implementation - would call external API in production
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    self.toxicity_api_url,
                    json={"text": text, "context": context},
                )
                response.raise_for_status()
                data = response.json()

                if data.get("toxic", False):
                    return GuardrailResult(
                        passed=False,
                        triggered_rule="toxicity",
                        action="block",
                        message=data.get("reason", "Toxic content detected"),
                    )

                return GuardrailResult(
                    passed=True,
                    triggered_rule=None,
                    action="allow",
                    message="Toxicity check passed",
                )
        except httpx.HTTPError:
            # On API error, fail open to avoid blocking legitimate requests
            return GuardrailResult(
                passed=True,
                triggered_rule=None,
                action="allow",
                message="Toxicity check API error, allowing",
            )


class GuardrailViolationError(Exception):
    """Exception raised when a guardrail blocks content.

    Attributes:
        result: The GuardrailResult that caused the violation.
    """

    def __init__(self, result: GuardrailResult):
        """Initialize with the guardrail result.

        Args:
            result: The GuardrailResult that triggered the violation.
        """
        self.result = result
        super().__init__(
            f"Guardrail violation: {result.triggered_rule} - {result.message}"
        )


class GuardrailMiddleware:
    """Middleware that applies a chain of guardrails to input and output text.

    Guardrails are applied in order, short-circuiting on first block.
    """

    def __init__(
        self,
        input_guardrails: list[InputGuardrail] | None = None,
        output_guardrails: list[OutputGuardrail] | None = None,
    ):
        """Initialize guardrail middleware.

        Args:
            input_guardrails: List of guardrails to apply to input.
            output_guardrails: List of guardrails to apply to output.
        """
        self.input_guardrails = input_guardrails or []
        self.output_guardrails = output_guardrails or []

    def check_input_text(self, text: str, context: dict[str, Any] | None = None) -> None:
        """Check input text against all input guardrails.

        Args:
            text: The input text to check.
            context: Additional context for the check.

        Raises:
            GuardrailViolationError: If any input guardrail blocks.
        """
        context = context or {}
        for guardrail in self.input_guardrails:
            result = guardrail.check(text, context)
            if result.action == "block" and not result.passed:
                raise GuardrailViolationError(result)

    def check_output_text(self, text: str, context: dict[str, Any] | None = None) -> None:
        """Check output text against all output guardrails.

        Args:
            text: The output text to check.
            context: Additional context for the check.

        Raises:
            GuardrailViolationError: If any output guardrail blocks.
        """
        context = context or {}
        for guardrail in self.output_guardrails:
            result = guardrail.check(text, context)
            if result.action == "block" and not result.passed:
                raise GuardrailViolationError(result)

    def check_input(
        self, text: str, context: dict[str, Any] | None = None
    ) -> list[GuardrailResult]:
        """Check input text and return all results (no short-circuit).

        Args:
            text: The input text to check.
            context: Additional context for the check.

        Returns:
            List of GuardrailResult from all input guardrails.
        """
        context = context or {}
        return [guardrail.check(text, context) for guardrail in self.input_guardrails]

    def check_output(
        self, text: str, context: dict[str, Any] | None = None
    ) -> list[GuardrailResult]:
        """Check output text and return all results (no short-circuit).

        Args:
            text: The output text to check.
            context: Additional context for the check.

        Returns:
            List of GuardrailResult from all output guardrails.
        """
        context = context or {}
        return [guardrail.check(text, context) for guardrail in self.output_guardrails]


__all__ = [
    "GuardrailResult",
    "InputGuardrail",
    "OutputGuardrail",
    "PIIBlocklistGuardrail",
    "RegexBlocklistGuardrail",
    "ToxicityGuardrail",
    "GuardrailViolationError",
    "GuardrailMiddleware",
]
