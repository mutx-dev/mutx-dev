"""Self-healing utilities for agent runtime.

Provides retry logic with exponential backoff and circuit breaker pattern
for handling transient failures in LLM calls and tool executions.
"""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, TypeVar

logger = logging.getLogger(__name__)

T = TypeVar("T")


class CircuitState(Enum):
    """Circuit breaker states."""

    CLOSED = "closed"  # Normal operation
    OPEN = "open"  # Failing - reject calls
    HALF_OPEN = "half_open"  # Testing if recovery


@dataclass
class RetryConfig:
    """Configuration for retry behavior."""

    max_attempts: int = 3
    initial_delay: float = 1.0  # seconds
    max_delay: float = 30.0  # seconds
    exponential_base: float = 2.0
    jitter: float = 0.1  # 10% jitter factor

    def get_delay(self, attempt: int) -> float:
        """Calculate delay for given attempt with exponential backoff and jitter."""
        import random

        delay = min(self.initial_delay * (self.exponential_base**attempt), self.max_delay)
        # Add jitter to prevent thundering herd
        jitter_range = delay * self.jitter
        delay += random.uniform(-jitter_range, jitter_range)
        return max(0, delay)


@dataclass
class CircuitBreakerConfig:
    """Configuration for circuit breaker."""

    failure_threshold: int = 5  # Failures before opening
    success_threshold: int = 2  # Successes to close from half-open
    timeout: float = 30.0  # Seconds before trying half-open


class CircuitBreaker:
    """Circuit breaker for preventing cascade failures."""

    def __init__(self, config: CircuitBreakerConfig | None = None):
        self.config = config or CircuitBreakerConfig()
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: float | None = None

    def record_success(self) -> None:
        """Record a successful call."""
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.config.success_threshold:
                self._transition_to_closed()
        else:
            self.failure_count = 0

    def record_failure(self) -> None:
        """Record a failed call."""
        self.failure_count += 1
        self.last_failure_time = time.time()

        if self.state == CircuitState.HALF_OPEN:
            self._transition_to_open()
        elif self.failure_count >= self.config.failure_threshold:
            self._transition_to_open()

    def can_execute(self) -> bool:
        """Check if execution is allowed."""
        if self.state == CircuitState.CLOSED:
            return True

        if self.state == CircuitState.OPEN:
            # Check if timeout has passed to try half-open
            if self.last_failure_time and (time.time() - self.last_failure_time) >= self.config.timeout:
                self._transition_to_half_open()
                return True
            return False

        # HALF_OPEN - allow one test request
        return True

    def _transition_to_closed(self) -> None:
        """Transition to closed state."""
        logger.info("Circuit breaker: CLOSED")
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0

    def _transition_to_open(self) -> None:
        """Transition to open state."""
        logger.warning("Circuit breaker: OPEN (failures=%d)", self.failure_count)
        self.state = CircuitState.OPEN

    def _transition_to_half_open(self) -> None:
        """Transition to half-open state."""
        logger.info("Circuit breaker: HALF_OPEN")
        self.state = CircuitState.HALF_OPEN
        self.success_count = 0


# Common transient errors that should trigger retry
TRANSIENT_ERRORS = (
    "rate_limit",
    "timeout",
    "connection",
    "temporary_failure",
    "service_unavailable",
    "429",
    "500",
    "502",
    "503",
    "504",
)


def is_transient_error(error: Exception) -> bool:
    """Determine if an error is transient and worth retrying."""
    error_str = str(error).lower()
    return any(keyword in error_str for keyword in TRANSIENT_ERRORS)


async def with_retry(
    func: Callable[..., Any],
    *args: Any,
    retry_config: RetryConfig | None = None,
    circuit_breaker: CircuitBreaker | None = None,
    **kwargs: Any,
) -> Any:
    """Execute a function with retry logic and circuit breaker.

    Args:
        func: Async function to execute
        *args: Positional arguments for func
        retry_config: Retry configuration (default: 3 attempts)
        circuit_breaker: Optional circuit breaker
        **kwargs: Keyword arguments for func

    Returns:
        Result from successful execution

    Raises:
        The last exception if all retries fail
    """
    config = retry_config or RetryConfig()
    last_error: Exception | None = None

    for attempt in range(config.max_attempts):
        # Check circuit breaker
        if circuit_breaker and not circuit_breaker.can_execute():
            raise CircuitBreakerOpenError("Circuit breaker is open")

        try:
            result = func(*args, **kwargs)
            if asyncio.iscoroutine(result):
                result = await result

            # Record success
            if circuit_breaker:
                circuit_breaker.record_success()

            return result

        except Exception as e:
            last_error = e

            # Record failure
            if circuit_breaker:
                circuit_breaker.record_failure()

            # Check if we should retry
            if attempt < config.max_attempts - 1 and is_transient_error(e):
                delay = config.get_delay(attempt)
                logger.warning(
                    "Retry attempt %d/%d after %.2fs due to: %s",
                    attempt + 1,
                    config.max_attempts,
                    delay,
                    str(e),
                )
                await asyncio.sleep(delay)
            else:
                # Non-transient error or last attempt - propagate
                logger.error(
                    "Retry exhausted or non-transient error: %s",
                    str(e),
                )
                break

    if last_error:
        raise last_error


class CircuitBreakerOpenError(Exception):
    """Raised when circuit breaker is open and rejecting calls."""

    pass


class SelfHealingRuntimeMixin:
    """Mixin that adds self-healing capabilities to runtime adapters."""

    retry_config: RetryConfig = field(default_factory=RetryConfig)
    circuit_breaker: CircuitBreaker | None = None

    async def execute_with_healing(
        self,
        messages: list[dict[str, Any]],
        **kwargs: Any,
    ) -> dict[str, Any]:
        """Execute with retry and circuit breaker protection."""
        return await with_retry(
            self._execute_impl,
            messages,
            retry_config=self.retry_config,
            circuit_breaker=self.circuit_breaker,
            **kwargs,
        )

    async def _execute_impl(
        self,
        messages: list[dict[str, Any]],
        **kwargs: Any,
    ) -> dict[str, Any]:
        """Actual implementation - override in subclass."""
        raise NotImplementedError
