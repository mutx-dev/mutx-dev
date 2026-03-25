"""
Approval Service.

Human-in-the-loop mechanism for high-risk or ambiguous actions.
Handles timeouts, multi-reviewer workflows, and escalation chains.

AARM Requirement: R5 (MUST support human approval workflows with timeout handling)

MIT License - Copyright (c) 2024 aarm-dev
https://github.com/aarm-dev/docs
"""

import secrets
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any, Optional

from src.security.mediator import NormalizedAction
from src.security.context import SessionContext


class ApprovalStatus(str, Enum):
    """Status of an approval request."""

    PENDING = "pending"
    APPROVED = "approved"
    DENIED = "denied"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class ApprovalTimeout(Exception):
    """Raised when an approval request times out."""

    pass


@dataclass
class ApprovalRequest:
    """
    A request for human approval of a deferred action.

    Created when the PolicyEngine returns DEFER, indicating a human
    needs to review and approve the action before it can execute.
    """

    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    token: str = field(default_factory=lambda: secrets.token_urlsafe(16))
    action: Optional[NormalizedAction] = None
    context: Optional[SessionContext] = None

    status: ApprovalStatus = ApprovalStatus.PENDING
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = field(
        default_factory=lambda: datetime.now(timezone.utc) + timedelta(minutes=5)
    )
    decided_at: Optional[datetime] = None
    decided_by: Optional[str] = None

    tool_name: str = ""
    tool_args: dict[str, Any] = field(default_factory=dict)
    agent_id: str = ""
    session_id: str = ""
    user_id: str = ""

    reason: str = ""
    reviewers: list[str] = field(default_factory=list)
    reviewer_comments: list[str] = field(default_factory=list)

    escalation_enabled: bool = True
    escalation_timeout_minutes: int = 10
    escalated_to: Optional[str] = None

    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def is_pending(self) -> bool:
        return self.status == ApprovalStatus.PENDING

    @property
    def is_expired(self) -> bool:
        if self.status != ApprovalStatus.PENDING:
            return False
        return datetime.now(timezone.utc) > self.expires_at

    @property
    def remaining_seconds(self) -> int:
        """Seconds until expiry."""
        delta = self.expires_at - datetime.now(timezone.utc)
        return max(0, int(delta.total_seconds()))

    def approve(self, reviewer: str, comment: str = "") -> bool:
        """Approve this request."""
        if not self.is_pending:
            return False
        self.status = ApprovalStatus.APPROVED
        self.decided_at = datetime.now(timezone.utc)
        self.decided_by = reviewer
        if comment:
            self.reviewer_comments.append(f"[APPROVED by {reviewer}]: {comment}")
        return True

    def deny(self, reviewer: str, reason: str = "") -> bool:
        """Deny this request."""
        if not self.is_pending:
            return False
        self.status = ApprovalStatus.DENIED
        self.decided_at = datetime.now(timezone.utc)
        self.decided_by = reviewer
        self.reason = reason
        self.reviewer_comments.append(f"[DENIED by {reviewer}]: {reason}")
        return True

    def cancel(self) -> None:
        """Cancel this request."""
        self.status = ApprovalStatus.CANCELLED

    def check_expired(self) -> bool:
        """Check and update expired status."""
        if self.is_expired:
            self.status = ApprovalStatus.EXPIRED
            return True
        return False


class ApprovalService:
    """
    Manages human approval workflows for deferred actions.

    The ApprovalService:
    1. Creates approval requests when actions are deferred
    2. Tracks request lifecycle (pending -> approved/denied/expired)
    3. Handles timeout escalation
    4. Stores audit trail of decisions

    Usage:
        service = ApprovalService()

        # Request approval for an action
        request = await service.request_approval(
            action=action,
            context=session_context,
            reason="High-value refund requires finance approval",
            reviewers=["finance-team"],
        )

        # Check status
        if request.is_pending:
            print(f"Pending approval. Token: {request.token}")

        # Approve
        service.approve(request.token, reviewer="admin@example.com")

        # Deny
        service.deny(request.token, reviewer="admin@example.com", reason="Insufficient documentation")
    """

    def __init__(self):
        self._requests: dict[str, ApprovalRequest] = {}
        self._tokens: dict[str, str] = {}
        self._default_timeout_minutes: int = 5
        self._escalation_enabled: bool = True

    def set_default_timeout(self, minutes: int) -> None:
        """Set default approval timeout in minutes."""
        self._default_timeout_minutes = minutes

    def set_escalation_enabled(self, enabled: bool) -> None:
        """Enable or disable automatic escalation."""
        self._escalation_enabled = enabled

    def request_approval(
        self,
        action: NormalizedAction,
        context: Optional[SessionContext] = None,
        reason: str = "",
        reviewers: Optional[list[str]] = None,
        timeout_minutes: Optional[int] = None,
        metadata: Optional[dict[str, Any]] = None,
    ) -> ApprovalRequest:
        """
        Create a new approval request.

        Args:
            action: The deferred action
            context: Session context
            reason: Why approval is needed
            reviewers: List of reviewer IDs/roles
            timeout_minutes: Timeout for this request
            metadata: Additional metadata

        Returns:
            The created ApprovalRequest
        """
        timeout = timeout_minutes or self._default_timeout_minutes
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=timeout)

        request = ApprovalRequest(
            action=action,
            context=context,
            status=ApprovalStatus.PENDING,
            created_at=datetime.now(timezone.utc),
            expires_at=expires_at,
            tool_name=action.tool_name,
            tool_args=action.tool_args,
            agent_id=action.agent_id,
            session_id=action.session_id,
            user_id=action.user_id,
            reason=reason,
            reviewers=reviewers or [],
            metadata=metadata or {},
        )

        self._requests[request.id] = request
        self._tokens[request.token] = request.id

        return request

    def get_request(self, request_id: str) -> Optional[ApprovalRequest]:
        """Get a request by ID."""
        request = self._requests.get(request_id)
        if request:
            request.check_expired()
        return request

    def get_by_token(self, token: str) -> Optional[ApprovalRequest]:
        """Get a request by approval token."""
        request_id = self._tokens.get(token)
        if not request_id:
            return None
        return self.get_request(request_id)

    def approve(self, token: str, reviewer: str, comment: str = "") -> bool:
        """
        Approve a request.

        Args:
            token: Approval token
            reviewer: Who approved
            comment: Optional comment

        Returns:
            True if approved, False if request not found or not pending
        """
        request = self.get_by_token(token)
        if not request:
            return False
        return request.approve(reviewer, comment)

    def deny(self, token: str, reviewer: str, reason: str = "") -> bool:
        """
        Deny a request.

        Args:
            token: Approval token
            reviewer: Who denied
            reason: Reason for denial

        Returns:
            True if denied, False if request not found or not pending
        """
        request = self.get_by_token(token)
        if not request:
            return False
        return request.deny(reviewer, reason)

    def cancel(self, request_id: str) -> bool:
        """
        Cancel a pending request.

        Args:
            request_id: Request ID to cancel

        Returns:
            True if cancelled, False if not found
        """
        request = self.get_request(request_id)
        if not request:
            return False
        request.cancel()
        return True

    def list_pending(self) -> list[ApprovalRequest]:
        """List all pending requests."""
        self._check_all_expired()
        return [r for r in self._requests.values() if r.is_pending]

    def list_expired(self) -> list[ApprovalRequest]:
        """List all expired requests."""
        expired = []
        for request in self._requests.values():
            request.check_expired()
            if request.status == ApprovalStatus.EXPIRED:
                expired.append(request)
        return expired

    def get_pending_for_reviewer(self, reviewer: str) -> list[ApprovalRequest]:
        """Get pending requests visible to a specific reviewer."""
        pending = self.list_pending()
        return [r for r in pending if not r.reviewers or reviewer in r.reviewers]

    def check_timeout(self, request_id: str) -> bool:
        """
        Check if a request has timed out.

        Args:
            request_id: Request ID to check

        Returns:
            True if expired, False otherwise
        """
        request = self.get_request(request_id)
        if not request:
            return False
        return request.check_expired()

    def escalate(self, request_id: str, escalate_to: str) -> Optional[ApprovalRequest]:
        """
        Escalate a pending request.

        Args:
            request_id: Request to escalate
            escalate_to: Who to escalate to

        Returns:
            Updated request or None if not found
        """
        request = self.get_request(request_id)
        if not request or not request.is_pending:
            return None

        if request.escalation_enabled:
            request.escalated_to = escalate_to
            request.expires_at = datetime.now(timezone.utc) + timedelta(
                minutes=request.escalation_timeout_minutes
            )
            return request

        return None

    def _check_all_expired(self) -> None:
        """Check and update all pending requests for expiration."""
        for request in self._requests.values():
            if request.status == ApprovalStatus.PENDING:
                request.check_expired()

    def cleanup_expired(self, max_age_hours: int = 24) -> int:
        """
        Remove expired requests older than max_age_hours.

        Args:
            max_age_hours: Maximum age in hours

        Returns:
            Number of requests cleaned up
        """
        cutoff = datetime.now(timezone.utc) - timedelta(hours=max_age_hours)
        to_remove = []

        for request in self._requests.values():
            if request.status in (
                ApprovalStatus.EXPIRED,
                ApprovalStatus.APPROVED,
                ApprovalStatus.DENIED,
                ApprovalStatus.CANCELLED,
            ):
                if request.decided_at and request.decided_at < cutoff:
                    to_remove.append(request.id)

        for request_id in to_remove:
            request = self._requests.pop(request_id, None)
            if request:
                self._tokens.pop(request.token, None)

        return len(to_remove)

    def get_stats(self) -> dict[str, Any]:
        """Get approval service statistics."""
        self._check_all_expired()

        by_status = {}
        for request in self._requests.values():
            status = request.status.value
            by_status[status] = by_status.get(status, 0) + 1

        return {
            "total_requests": len(self._requests),
            "pending": by_status.get("pending", 0),
            "approved": by_status.get("approved", 0),
            "denied": by_status.get("denied", 0),
            "expired": by_status.get("expired", 0),
            "cancelled": by_status.get("cancelled", 0),
        }
