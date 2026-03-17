"""Circuit breaker pattern implementation for runtime adapters."""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from enum import Enum


class CircuitState(str, Enum):
    """Circuit breaker states."""
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


@dataclass
class CircuitBreaker:
    """Simple circuit breaker for API calls.
    
    Prevents cascading failures by stopping requests when a service
    is experiencing issues. After a threshold of failures, the circuit
    opens and rejects requests for a recovery timeout period.
    """

    failure_threshold: int = 5
    recovery_timeout: float = 30.0
    state: CircuitState = field(default=CircuitState.CLOSED, init=False)
    failures: int = field(default=0, init=False)
    last_failure_time: float = field(default=0.0, init=False)

    def record_success(self) -> None:
        """Record a successful call - reset failure count."""
        self.failures = 0
        self.state = CircuitState.CLOSED

    def record_failure(self) -> None:
        """Record a failed call - increment counter and potentially open circuit."""
        self.failures += 1
        self.last_failure_time = time.monotonic()
        if self.failures >= self.failure_threshold:
            self.state = CircuitState.OPEN

    def can_attempt(self) -> bool:
        """Check if a request should be attempted."""
        if self.state == CircuitState.CLOSED:
            return True
        if self.state == CircuitState.OPEN:
            elapsed = time.monotonic() - self.last_failure_time
            if elapsed >= self.recovery_timeout:
                self.state = CircuitState.HALF_OPEN
                return True
            return False
        return True

    def get_state(self) -> CircuitState:
        """Get current circuit state."""
        return self.state
