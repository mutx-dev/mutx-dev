from __future__ import annotations

import hashlib
import json
import logging
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, func, or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import set_committed_value

from src.api.models.approval import ApprovalAuditEvent, ApprovalNotificationOutbox, ApprovalRecord
from src.api.models.models import User
from src.api.services.approval import (
    ApprovalRequest,
    ApprovalStatus,
    post_approval_webhook,
)

logger = logging.getLogger(__name__)

ADMIN_ROLE = "ADMIN"
DEVELOPER_ROLE = "DEVELOPER"

OUTBOX_PENDING = "PENDING"
OUTBOX_PROCESSING = "PROCESSING"
OUTBOX_DELIVERED = "DELIVERED"
OUTBOX_FAILED = "FAILED"


class ApprovalNotFoundError(Exception):
    """The approval is not visible to the current user."""


class ApprovalForbiddenError(Exception):
    """The current user can see but cannot resolve the approval."""


class ApprovalTransitionConflictError(Exception):
    """The approval has already left the pending state."""

    def __init__(self, current_status: str):
        super().__init__(f"Approval request is already in '{current_status}' state")
        self.current_status = current_status


class ApprovalIdempotencyConflictError(Exception):
    """An idempotency key was already bound to different request content."""


class ApprovalReviewerError(Exception):
    """An explicit reviewer assignment is invalid."""


@dataclass(frozen=True)
class ApprovalCreateResult:
    record: ApprovalRecord
    replayed: bool


async def get_persisted_roles(
    db: AsyncSession,
    user: User,
    *,
    for_update: bool = False,
) -> set[str]:
    """Reload database-authoritative roles without flushing transient mutations."""
    stmt = select(User.roles).where(User.id == user.id)
    if for_update:
        stmt = stmt.with_for_update()
    with db.no_autoflush:
        stored_roles = (await db.execute(stmt)).scalar_one_or_none()
    role_values = stored_roles if isinstance(stored_roles, list) else []
    set_committed_value(user, "roles", list(role_values))
    return {role.strip().upper() for role in role_values if isinstance(role, str) and role.strip()}


def approval_request_hash(
    *,
    agent_id: str,
    session_id: str,
    action_type: str,
    payload: dict,
    reviewer_id: uuid.UUID | None,
) -> str:
    canonical_request = json.dumps(
        {
            "action_type": action_type,
            "agent_id": agent_id,
            "payload": payload,
            "reviewer_id": str(reviewer_id) if reviewer_id else None,
            "session_id": session_id,
        },
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    )
    return hashlib.sha256(canonical_request.encode("utf-8")).hexdigest()


def _visible_scope(user_id: uuid.UUID, roles: set[str]):
    if ADMIN_ROLE in roles:
        return None
    return or_(ApprovalRecord.owner_id == user_id, ApprovalRecord.reviewer_id == user_id)


def _as_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _legacy_security_expired(
    payload: object,
    created_at: datetime,
    *,
    now: datetime,
) -> bool:
    if not isinstance(payload, dict) or payload.get("source") != "legacy_security":
        return False
    timeout_minutes = payload.get("timeout_minutes", 5)
    if not isinstance(timeout_minutes, int) or not 1 <= timeout_minutes <= 60:
        timeout_minutes = 5
    return now >= _as_utc(created_at) + timedelta(minutes=timeout_minutes)


def record_approval_event(
    db: AsyncSession, record: ApprovalRecord, event_type: str, actor_id: uuid.UUID | None = None
) -> None:
    db.add(
        ApprovalAuditEvent(
            approval_id=record.id,
            event_type=event_type,
            actor_id=actor_id,
            details={
                "status": record.status,
                "agent_id": record.agent_id,
                "session_id": record.session_id,
                "policy_decision_id": record.payload.get("policy_approval_dedupe_key"),
                "reviewer_id": str(record.reviewer_id) if record.reviewer_id else None,
            },
        )
    )


async def _expire_visible_legacy_security_approvals(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    roles: set[str],
    request_id: uuid.UUID | None = None,
) -> None:
    """Enforce expiry and escalation before reads, decisions, and execution claims."""
    filters = [ApprovalRecord.status.in_(["PENDING", "APPROVED"])]
    scope = _visible_scope(user_id, roles)
    if scope is not None:
        filters.append(scope)
    if request_id is not None:
        filters.append(ApprovalRecord.id == request_id)
    records = (
        (
            await db.execute(
                select(ApprovalRecord).where(*filters).execution_options(populate_existing=True)
            )
        )
        .scalars()
        .all()
    )
    now = datetime.now(timezone.utc)
    changed = False
    for record in records:
        expired = record.expires_at is not None and _as_utc(record.expires_at) <= now
        expired = expired or _legacy_security_expired(record.payload, record.created_at, now=now)
        escalated = (
            record.status == "PENDING"
            and record.escalated_at is None
            and record.escalates_at is not None
            and _as_utc(record.escalates_at) <= now
        )
        if not expired and not escalated:
            continue
        conditions = [
            ApprovalRecord.id == record.id,
            ApprovalRecord.status == record.status,
            ApprovalRecord.consumed_at.is_(None),
        ]
        values = {"updated_at": now}
        if expired:
            values.update(status="EXPIRED", resolved_at=now)
        else:
            conditions.append(ApprovalRecord.escalated_at.is_(None))
            values.update(reviewer_id=None, escalated_at=now)
        updated = (
            await db.execute(
                update(ApprovalRecord)
                .where(*conditions)
                .values(**values)
                .returning(ApprovalRecord)
                .execution_options(synchronize_session=False, populate_existing=True)
            )
        ).scalar_one_or_none()
        if updated is not None:
            await db.refresh(updated)
            record_approval_event(db, updated, "expired" if expired else "escalated")
            changed = True
    if changed:
        await db.commit()


def approval_can_resolve(
    record: ApprovalRecord,
    *,
    user_id: uuid.UUID,
    roles: set[str],
) -> bool:
    """Compute actionability from canonical state and database-backed authority."""
    if record.status != ApprovalStatus.PENDING.value or record.owner_id == user_id:
        return False
    if ADMIN_ROLE in roles:
        return True
    return DEVELOPER_ROLE in roles and record.reviewer_id == user_id


def approval_request_from_record(
    record: ApprovalRecord,
    *,
    user_id: uuid.UUID | None = None,
    roles: set[str] | None = None,
) -> ApprovalRequest:
    return ApprovalRequest(
        id=record.id,
        owner_id=record.owner_id,
        reviewer_id=record.reviewer_id,
        can_resolve=(
            approval_can_resolve(record, user_id=user_id, roles=roles or set())
            if user_id is not None
            else False
        ),
        agent_id=record.agent_id,
        session_id=record.session_id,
        action_type=record.action_type,
        payload=record.payload,
        status=ApprovalStatus(record.status),
        requester=record.requester,
        approver=record.approver,
        created_at=_as_utc(record.created_at),
        resolved_at=_as_utc(record.resolved_at),
        comment=record.comment,
        expires_at=_as_utc(record.expires_at),
        escalates_at=_as_utc(record.escalates_at),
        escalated_at=_as_utc(record.escalated_at),
        consumed_at=_as_utc(record.consumed_at),
    )


async def list_eligible_reviewers(
    db: AsyncSession,
    *,
    owner_id: uuid.UUID,
) -> list[User]:
    """Return active, non-owner users with a database-backed reviewer role."""
    with db.no_autoflush:
        candidates = list(
            (
                await db.execute(
                    select(User)
                    .where(User.id != owner_id, User.is_active.is_(True))
                    .order_by(User.email.asc(), User.id.asc())
                )
            )
            .scalars()
            .all()
        )
    return [
        candidate
        for candidate in candidates
        if {
            role.strip().upper()
            for role in (candidate.roles if isinstance(candidate.roles, list) else [])
            if isinstance(role, str) and role.strip()
        }
        & {ADMIN_ROLE, DEVELOPER_ROLE}
    ]


async def _validate_reviewer(
    db: AsyncSession,
    *,
    owner_id: uuid.UUID,
    reviewer_id: uuid.UUID | None,
) -> None:
    if reviewer_id is None:
        return
    if reviewer_id == owner_id:
        raise ApprovalReviewerError("Approval owners cannot be assigned as their own reviewer")

    with db.no_autoflush:
        reviewer_roles = (
            await db.execute(select(User.roles).where(User.id == reviewer_id))
        ).scalar_one_or_none()
    if reviewer_roles is None:
        raise ApprovalReviewerError("Assigned reviewer was not found")
    role_values = reviewer_roles if isinstance(reviewer_roles, list) else []
    normalized_roles = {
        role.strip().upper() for role in role_values if isinstance(role, str) and role.strip()
    }
    if not normalized_roles & {ADMIN_ROLE, DEVELOPER_ROLE}:
        raise ApprovalReviewerError("Assigned reviewer must have a persisted reviewer role")


def _notification_payload(record: ApprovalRecord) -> dict:
    return {
        "id": str(record.id),
        "agent_id": record.agent_id,
        "session_id": record.session_id,
        "action_type": record.action_type,
        "payload": record.payload,
        "status": record.status,
        "requester": record.requester,
        "created_at": _as_utc(record.created_at).isoformat(),
    }


async def _load_idempotent_record(
    db: AsyncSession,
    *,
    owner_id: uuid.UUID,
    idempotency_key: str,
) -> ApprovalRecord | None:
    return (
        await db.execute(
            select(ApprovalRecord).where(
                ApprovalRecord.owner_id == owner_id,
                ApprovalRecord.idempotency_key == idempotency_key,
            )
        )
    ).scalar_one_or_none()


def _assert_matching_idempotent_request(record: ApprovalRecord, request_hash: str) -> None:
    if record.request_hash != request_hash:
        raise ApprovalIdempotencyConflictError(
            "Idempotency key is already bound to a different approval request"
        )


async def create_approval_record(
    db: AsyncSession,
    *,
    owner: User,
    agent_id: str,
    session_id: str,
    action_type: str,
    payload: dict,
    reviewer_id: uuid.UUID | None,
    idempotency_key: str | None,
    webhook_url: str | None,
    timeout_seconds: int = 3600,
    escalation_seconds: int | None = 900,
) -> ApprovalCreateResult:
    """Create an approval and its notification event in one transaction."""
    if not 60 <= timeout_seconds <= 86400:
        raise ApprovalReviewerError("Approval timeout must be between 60 and 86400 seconds")
    if escalation_seconds is not None and not 1 <= escalation_seconds < timeout_seconds:
        escalation_seconds = None
    owner_id = owner.id
    owner_email = owner.email
    normalized_key = idempotency_key.strip() if idempotency_key is not None else None
    if normalized_key == "":
        raise ApprovalIdempotencyConflictError("Idempotency key cannot be blank")

    request_hash = approval_request_hash(
        agent_id=agent_id,
        session_id=session_id,
        action_type=action_type,
        payload=payload,
        reviewer_id=reviewer_id,
    )

    if normalized_key is not None:
        existing = await _load_idempotent_record(
            db,
            owner_id=owner_id,
            idempotency_key=normalized_key,
        )
        if existing is not None:
            _assert_matching_idempotent_request(existing, request_hash)
            return ApprovalCreateResult(record=existing, replayed=True)

    await _validate_reviewer(db, owner_id=owner_id, reviewer_id=reviewer_id)

    now = datetime.now(timezone.utc)
    record = ApprovalRecord(
        id=uuid.uuid4(),
        owner_id=owner_id,
        reviewer_id=reviewer_id,
        agent_id=agent_id,
        session_id=session_id,
        action_type=action_type,
        payload=payload,
        status=ApprovalStatus.PENDING.value,
        requester=owner_email,
        idempotency_key=normalized_key,
        request_hash=request_hash,
        created_at=now,
        updated_at=now,
        expires_at=now + timedelta(seconds=timeout_seconds),
        escalates_at=now + timedelta(seconds=escalation_seconds) if escalation_seconds else None,
    )
    db.add(record)
    record_approval_event(db, record, "created", owner_id)

    normalized_webhook_url = webhook_url.strip() if webhook_url else None
    if normalized_webhook_url:
        db.add(
            ApprovalNotificationOutbox(
                id=uuid.uuid4(),
                approval_id=record.id,
                destination_url=normalized_webhook_url,
                event_payload=_notification_payload(record),
                status=OUTBOX_PENDING,
                attempt_count=0,
                next_attempt_at=now,
                created_at=now,
                updated_at=now,
            )
        )

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        if normalized_key is None:
            raise
        existing = await _load_idempotent_record(
            db,
            owner_id=owner_id,
            idempotency_key=normalized_key,
        )
        if existing is None:
            raise
        _assert_matching_idempotent_request(existing, request_hash)
        return ApprovalCreateResult(record=existing, replayed=True)

    return ApprovalCreateResult(record=record, replayed=False)


async def get_visible_approval(
    db: AsyncSession,
    *,
    request_id: uuid.UUID,
    user: User,
) -> ApprovalRecord:
    roles = await get_persisted_roles(db, user)
    await _expire_visible_legacy_security_approvals(
        db,
        user_id=user.id,
        roles=roles,
        request_id=request_id,
    )
    stmt = select(ApprovalRecord).where(ApprovalRecord.id == request_id)
    scope = _visible_scope(user.id, roles)
    if scope is not None:
        stmt = stmt.where(scope)

    record = (await db.execute(stmt)).scalar_one_or_none()
    if record is None:
        raise ApprovalNotFoundError("Approval request not found")
    return record


async def list_visible_approvals(
    db: AsyncSession,
    *,
    user: User,
    status_filter: ApprovalStatus | None,
    agent_id: str | None,
    offset: int,
    limit: int,
) -> tuple[list[ApprovalRecord], int]:
    filters = []
    roles = await get_persisted_roles(db, user)
    await _expire_visible_legacy_security_approvals(
        db,
        user_id=user.id,
        roles=roles,
    )
    scope = _visible_scope(user.id, roles)
    if scope is not None:
        filters.append(scope)
    if status_filter is not None:
        filters.append(ApprovalRecord.status == status_filter.value)
    if agent_id is not None:
        filters.append(ApprovalRecord.agent_id == agent_id)

    total = (
        await db.execute(select(func.count()).select_from(ApprovalRecord).where(*filters))
    ).scalar_one()
    records = (
        (
            await db.execute(
                select(ApprovalRecord)
                .where(*filters)
                .order_by(ApprovalRecord.created_at.desc(), ApprovalRecord.id.desc())
                .offset(offset)
                .limit(limit)
            )
        )
        .scalars()
        .all()
    )
    return list(records), total


async def resolve_approval(
    db: AsyncSession,
    *,
    request_id: uuid.UUID,
    user: User,
    target_status: ApprovalStatus,
    comment: str | None,
) -> ApprovalRecord:
    """Atomically move one visible request from PENDING to a terminal state."""
    user_id = user.id
    user_email = user.email
    roles = await get_persisted_roles(db, user, for_update=True)
    now = datetime.now(timezone.utc)
    await _expire_visible_legacy_security_approvals(
        db,
        user_id=user_id,
        roles=roles,
        request_id=request_id,
    )

    # Deadline transitions may commit, so reacquire the role lock before deciding.
    roles = await get_persisted_roles(db, user, for_update=True)
    now = datetime.now(timezone.utc)
    authorization_filter = None
    if ADMIN_ROLE in roles:
        authorization_filter = ApprovalRecord.owner_id != user_id
    elif DEVELOPER_ROLE in roles:
        authorization_filter = and_(
            ApprovalRecord.reviewer_id == user_id,
            ApprovalRecord.owner_id != user_id,
        )

    if authorization_filter is not None:
        result = await db.execute(
            update(ApprovalRecord)
            .where(
                ApprovalRecord.id == request_id,
                ApprovalRecord.status == ApprovalStatus.PENDING.value,
                authorization_filter,
                or_(ApprovalRecord.expires_at.is_(None), ApprovalRecord.expires_at > now),
            )
            .values(
                status=target_status.value,
                approver=user_email,
                comment=comment,
                resolved_at=now,
                updated_at=now,
            )
            .returning(ApprovalRecord)
            .execution_options(synchronize_session=False)
        )
        resolved = result.scalar_one_or_none()
        if resolved is not None:
            await db.refresh(resolved)
            record_approval_event(db, resolved, target_status.value.lower(), user_id)
            await db.commit()
            return resolved
        # The conditional UPDATE made no changes. Commit the diagnostic-free
        # transaction so the authenticated ORM principal remains usable by
        # request-scoped dependency overrides and subsequent operations.
        await db.commit()

    diagnostic_stmt = select(ApprovalRecord).where(ApprovalRecord.id == request_id)
    diagnostic_scope = _visible_scope(user_id, roles)
    if diagnostic_scope is not None:
        diagnostic_stmt = diagnostic_stmt.where(diagnostic_scope)
    visible = (await db.execute(diagnostic_stmt)).scalar_one_or_none()
    if visible is None:
        raise ApprovalNotFoundError("Approval request not found")
    if visible.owner_id == user_id:
        raise ApprovalForbiddenError("Approval request owners cannot resolve their own request")
    if ADMIN_ROLE not in roles and not (DEVELOPER_ROLE in roles and visible.reviewer_id == user_id):
        raise ApprovalForbiddenError("A persisted reviewer assignment is required")
    if visible.status != ApprovalStatus.PENDING.value:
        raise ApprovalTransitionConflictError(visible.status)

    # A matching PENDING row can only reach this point if another transaction
    # changed it between the conditional update and this diagnostic read.
    raise ApprovalTransitionConflictError(visible.status)


async def deliver_approval_notification(
    db: AsyncSession,
    *,
    approval_id: uuid.UUID,
) -> str | None:
    """Claim and deliver one eligible outbox event with durable retry state."""
    now = datetime.now(timezone.utc)
    stale_before = now - timedelta(minutes=5)
    claim = await db.execute(
        update(ApprovalNotificationOutbox)
        .where(
            ApprovalNotificationOutbox.approval_id == approval_id,
            or_(
                ApprovalNotificationOutbox.status == OUTBOX_PENDING,
                and_(
                    ApprovalNotificationOutbox.status == OUTBOX_FAILED,
                    ApprovalNotificationOutbox.next_attempt_at <= now,
                ),
                and_(
                    ApprovalNotificationOutbox.status == OUTBOX_PROCESSING,
                    ApprovalNotificationOutbox.locked_at <= stale_before,
                ),
            ),
        )
        .values(
            status=OUTBOX_PROCESSING,
            attempt_count=ApprovalNotificationOutbox.attempt_count + 1,
            locked_at=now,
            updated_at=now,
        )
        .returning(
            ApprovalNotificationOutbox.id,
            ApprovalNotificationOutbox.destination_url,
            ApprovalNotificationOutbox.event_payload,
            ApprovalNotificationOutbox.attempt_count,
        )
        .execution_options(synchronize_session=False)
    )
    claimed = claim.mappings().one_or_none()
    if claimed is None:
        current_status = (
            await db.execute(
                select(ApprovalNotificationOutbox.status).where(
                    ApprovalNotificationOutbox.approval_id == approval_id
                )
            )
        ).scalar_one_or_none()
        await db.commit()
        return current_status

    await db.commit()
    delivery_id = claimed["id"]
    attempt_count = claimed["attempt_count"]
    try:
        await post_approval_webhook(
            claimed["destination_url"],
            claimed["event_payload"],
            delivery_id=str(delivery_id),
        )
    except Exception as exc:
        failed_at = datetime.now(timezone.utc)
        retry_delay = min(3600, 2 ** min(attempt_count, 10))
        await db.execute(
            update(ApprovalNotificationOutbox)
            .where(
                ApprovalNotificationOutbox.id == delivery_id,
                ApprovalNotificationOutbox.status == OUTBOX_PROCESSING,
                ApprovalNotificationOutbox.attempt_count == attempt_count,
            )
            .values(
                status=OUTBOX_FAILED,
                last_error=str(exc)[:4000],
                next_attempt_at=failed_at + timedelta(seconds=retry_delay),
                locked_at=None,
                updated_at=failed_at,
            )
            .execution_options(synchronize_session=False)
        )
        await db.commit()
        logger.warning(
            "Approval webhook delivery failed: approval_id=%s attempt=%d error=%s",
            approval_id,
            attempt_count,
            exc,
        )
        return OUTBOX_FAILED

    delivered_at = datetime.now(timezone.utc)
    await db.execute(
        update(ApprovalNotificationOutbox)
        .where(
            ApprovalNotificationOutbox.id == delivery_id,
            ApprovalNotificationOutbox.status == OUTBOX_PROCESSING,
            ApprovalNotificationOutbox.attempt_count == attempt_count,
        )
        .values(
            status=OUTBOX_DELIVERED,
            last_error=None,
            delivered_at=delivered_at,
            locked_at=None,
            updated_at=delivered_at,
        )
        .execution_options(synchronize_session=False)
    )
    await db.commit()
    return OUTBOX_DELIVERED


__all__ = [
    "ApprovalCreateResult",
    "ApprovalForbiddenError",
    "ApprovalIdempotencyConflictError",
    "ApprovalNotFoundError",
    "ApprovalReviewerError",
    "ApprovalTransitionConflictError",
    "approval_can_resolve",
    "approval_request_from_record",
    "approval_request_hash",
    "create_approval_record",
    "deliver_approval_notification",
    "get_visible_approval",
    "get_persisted_roles",
    "list_eligible_reviewers",
    "list_visible_approvals",
    "resolve_approval",
]
