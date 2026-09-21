"""Tenant-scoped policy evaluation and durable exact-action approvals."""

import hashlib
import hmac
import json
import re
import uuid
from datetime import datetime, timezone
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from src.api.config import get_settings
from src.api.models import User
from src.api.models.approval import ApprovalRecord
from src.api.services.approval import ApprovalRequest
from src.api.services.approval_persistence import (
    ApprovalForbiddenError,
    approval_request_from_record,
    create_approval_record,
    deliver_approval_notification,
    get_persisted_roles,
    get_visible_approval,
    record_approval_event,
)
from src.api.services.policy_store import (
    PolicyEvaluationContext,
    PolicyEvaluationResult,
    PolicyStore,
)

APPROVAL_CONTEXT_REDACTION_MARKER = "[REDACTED]"
APPROVAL_CONTEXT_REDACTION_POLICY = "secret-values-v1"
_POLICY_APPROVAL_DEDUPE_KEY_CONTEXT = b"mutx.policy-approval-dedupe.v2"
_SENSITIVE_CONTEXT_KEYS = frozenset(
    {
        "access_key",
        "access_key_id",
        "api_key",
        "apikey",
        "auth_token",
        "authorization",
        "client_secret",
        "cookie",
        "credential",
        "credentials",
        "password",
        "passwd",
        "private_key",
        "refresh_token",
        "secret",
        "secret_key",
        "secret_access_key",
        "set_cookie",
        "token",
    }
)
_SENSITIVE_CONTEXT_KEY_SUFFIXES = (
    "_api_key",
    "_credential",
    "_password",
    "_private_key",
    "_secret",
    "_secret_key",
    "_token",
)
_PRIVATE_KEY_PATTERN = re.compile(
    r"-----BEGIN(?: [A-Z0-9]+)? PRIVATE KEY-----.*?" r"-----END(?: [A-Z0-9]+)? PRIVATE KEY-----",
    re.DOTALL,
)
_CONTEXT_ASSIGNMENT_PATTERN = re.compile(
    r"(?i)(?P<prefix>[\"']?(?P<label>\b[a-z][a-z0-9_-]*\b)[\"']?\s*[:=]\s*)"
    r"(?:(?P<quote>[\"'])(?P<quoted>(?:\\.|(?!(?P=quote)).)*)(?P=quote)|"
    r"(?P<bare>(?:Bearer\s+)?[^\s,;}]+))"
)
_BEARER_TOKEN_PATTERN = re.compile(r"(?i)\b(Bearer\s+)[A-Za-z0-9._~+/=-]{8,}")
_SECRET_TOKEN_PATTERNS = (
    re.compile(r"\b(?:gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9_-]{16,})\b"),
    re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    re.compile(r"\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b"),
)


def _is_sensitive_context_key(key: object) -> bool:
    if not isinstance(key, str):
        return False
    snake_case_key = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", key)
    normalized = re.sub(r"[^a-z0-9]+", "_", snake_case_key.casefold()).strip("_")
    return normalized in _SENSITIVE_CONTEXT_KEYS or normalized.endswith(
        _SENSITIVE_CONTEXT_KEY_SUFFIXES
    )


def _redact_secret_text(value: str) -> tuple[str, bool]:
    redacted = _PRIVATE_KEY_PATTERN.sub(APPROVAL_CONTEXT_REDACTION_MARKER, value)

    chunks: list[str] = []
    cursor = 0
    search_from = 0
    while match := _CONTEXT_ASSIGNMENT_PATTERN.search(redacted, search_from):
        if not _is_sensitive_context_key(match.group("label")):
            # Resume inside a safe assignment so a nested query-string secret,
            # such as ``callback=https://host/?token=...``, is still found.
            search_from = match.start() + 1
            continue
        quote = match.group("quote") or ""
        chunks.append(redacted[cursor : match.start()])
        chunks.append(f"{match.group('prefix')}{quote}{APPROVAL_CONTEXT_REDACTION_MARKER}{quote}")
        cursor = match.end()
        search_from = match.end()
    if chunks:
        chunks.append(redacted[cursor:])
        redacted = "".join(chunks)
    redacted = _BEARER_TOKEN_PATTERN.sub(
        rf"\1{APPROVAL_CONTEXT_REDACTION_MARKER}",
        redacted,
    )
    for pattern in _SECRET_TOKEN_PATTERNS:
        redacted = pattern.sub(APPROVAL_CONTEXT_REDACTION_MARKER, redacted)
    return redacted, redacted != value


def _redact_approval_context_value(value: object) -> tuple[object, bool]:
    """Preserve evaluated context while masking recognized secret values."""
    if isinstance(value, dict):
        result: dict = {}
        redacted = False
        for key, item in value.items():
            if _is_sensitive_context_key(key):
                result[key] = APPROVAL_CONTEXT_REDACTION_MARKER
                redacted = True
                continue
            safe_item, item_redacted = _redact_approval_context_value(item)
            result[key] = safe_item
            redacted = redacted or item_redacted
        return result, redacted
    if isinstance(value, list):
        result = []
        redacted = False
        for item in value:
            safe_item, item_redacted = _redact_approval_context_value(item)
            result.append(safe_item)
            redacted = redacted or item_redacted
        return result, redacted
    if isinstance(value, str):
        return _redact_secret_text(value)
    return value, False


class PolicyApprovalEvaluationResult(PolicyEvaluationResult):
    """Policy evaluation result plus optional linked approval request."""

    approval_request: ApprovalRequest | None = None
    approval_created: bool = False
    approval_dedupe_key: str | None = None


def _policy_approval_dedupe_key(
    context: PolicyEvaluationContext,
    result: PolicyEvaluationResult,
    user: User,
) -> str:
    key_payload = {
        "user_id": str(user.id),
        "run_id": context.run_id,
        "session_id": context.session_id,
        "agent_id": context.agent_id,
        "tool": context.tool,
        "input": context.input,
        "output": context.output,
        "tool_args": context.tool_args or {},
        "metadata": context.metadata,
        "matches": [match.model_dump(mode="json") for match in result.matches],
    }
    serialized = json.dumps(
        key_payload,
        sort_keys=True,
        separators=(",", ":"),
        default=str,
    )
    settings = get_settings()
    key_material = settings.secret_encryption_key or settings.jwt_secret
    purpose_key = hmac.new(
        key_material.encode("utf-8"),
        _POLICY_APPROVAL_DEDUPE_KEY_CONTEXT,
        hashlib.sha256,
    ).digest()
    digest = hmac.new(
        purpose_key,
        serialized.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"policy-approval:v2:{digest}"


def _approval_payload(
    context: PolicyEvaluationContext,
    result: PolicyEvaluationResult,
    dedupe_key: str,
) -> dict:
    safe_context, context_redacted = _redact_approval_context_value(
        {
            "run_id": context.run_id,
            "session_id": context.session_id,
            "agent_id": context.agent_id,
            "tool": context.tool,
            "input": context.input,
            "output": context.output,
            "tool_args": context.tool_args or {},
            "metadata": context.metadata,
        }
    )
    return {
        "policy_approval_dedupe_key": dedupe_key,
        "policy_decision": result.decision,
        "policy_reason": result.reason,
        "policy_matches": [match.model_dump(mode="json") for match in result.matches],
        "context": safe_context,
        "context_redaction": {
            "policy": APPROVAL_CONTEXT_REDACTION_POLICY,
            "marker": APPROVAL_CONTEXT_REDACTION_MARKER,
            "applied": context_redacted,
        },
    }


async def evaluate_with_approval(
    db: AsyncSession,
    user: User,
    context: PolicyEvaluationContext,
    *,
    runtime_policy: dict | None = None,
    reviewer_id: uuid.UUID | None = None,
) -> PolicyApprovalEvaluationResult:
    result = await PolicyStore(db, user.id).evaluate(context)
    if runtime_policy is not None and result.decision not in {"block", "require_approval"}:
        result.decision = "require_approval"
        result.reason = "Runtime policy requires approval"
    # Bind runtime policy identity as well as persisted tenant policy versions.
    if runtime_policy is not None:
        context = context.model_copy(
            update={"metadata": {**context.metadata, "runtime_policy": runtime_policy}}
        )
    response = PolicyApprovalEvaluationResult(**result.model_dump())
    if result.decision != "require_approval":
        return response
    roles = await get_persisted_roles(db, user)
    if not roles & {"ADMIN", "DEVELOPER"} or str(
        getattr(user.plan, "value", user.plan)
    ).lower() not in {"starter", "pro", "enterprise"}:
        raise ApprovalForbiddenError("Approval creation requires a paid developer account")
    dedupe_key = _policy_approval_dedupe_key(context, result, user)
    created = await create_approval_record(
        db,
        owner=user,
        agent_id=context.agent_id or "",
        session_id=context.session_id or context.run_id or "",
        action_type=context.tool or "policy.require_approval",
        payload=_approval_payload(context, result, dedupe_key),
        reviewer_id=reviewer_id,
        idempotency_key=dedupe_key,
        webhook_url=getattr(get_settings(), "approval_webhook_url", None),
    )
    record = await get_visible_approval(db, request_id=created.record.id, user=user)
    await deliver_approval_notification(db, approval_id=record.id)
    response.approval_request = approval_request_from_record(record, user_id=user.id, roles=roles)
    response.approval_created = not created.replayed
    response.approval_dedupe_key = dedupe_key
    return response


async def consume_approval(
    db: AsyncSession, *, user: User, approval_id: uuid.UUID, dedupe_key: str
) -> bool:
    record = await get_visible_approval(db, request_id=approval_id, user=user)
    if record.owner_id != user.id or record.idempotency_key != dedupe_key:
        return False
    now = datetime.now(timezone.utc)
    claimed = (
        await db.execute(
            update(ApprovalRecord)
            .where(
                ApprovalRecord.id == approval_id,
                ApprovalRecord.owner_id == user.id,
                ApprovalRecord.idempotency_key == dedupe_key,
                ApprovalRecord.status == "APPROVED",
                ApprovalRecord.consumed_at.is_(None),
                ApprovalRecord.expires_at > now,
            )
            .values(consumed_at=now, updated_at=now)
            .returning(ApprovalRecord)
            .execution_options(synchronize_session=False)
        )
    ).scalar_one_or_none()
    if claimed is None:
        return False
    await db.refresh(claimed)
    record_approval_event(db, claimed, "consumed", user.id)
    await db.commit()
    return True
