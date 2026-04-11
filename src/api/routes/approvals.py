"""
Approval workflow REST endpoints.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.config import get_settings
from src.api.database import get_db
from src.api.middleware.auth import get_current_user
from src.api.models import User, UserSetting
from src.api.services.approval import ApprovalRequest, ApprovalService, ApprovalStatus

router = APIRouter(prefix="/approvals", tags=["approvals"])
logger = logging.getLogger(__name__)

APPROVER_ROLES = {"DEVELOPER", "ADMIN"}
APPROVAL_KEY_PREFIX = "approval.request."


def _has_approver_role(user: User) -> bool:
    role: Optional[str] = getattr(user, "role", None)
    return role in APPROVER_ROLES if role is not None else False


def _ensure_approval_visible(user: User, req: ApprovalRequest) -> None:
    if _has_approver_role(user):
        return
    if req.requester == user.email or req.approver == user.email:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Approval request is not visible to this user",
    )


def _approval_key(request_id: str) -> str:
    return f"{APPROVAL_KEY_PREFIX}{request_id}"


def _coerce_approval_request(value: object) -> ApprovalRequest | None:
    if not isinstance(value, dict):
        return None

    try:
        return ApprovalRequest.model_validate(value)
    except Exception:
        logger.warning("Skipping malformed approval record", extra={"value": value})
        return None


async def _load_approval_setting(
    db: AsyncSession,
    request_id: str,
) -> tuple[UserSetting, ApprovalRequest]:
    result = await db.execute(
        select(UserSetting).where(UserSetting.key == _approval_key(request_id))
    )
    setting = result.scalar_one_or_none()
    if setting is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Approval request not found",
        )

    approval = _coerce_approval_request(setting.value)
    if approval is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stored approval request is invalid",
        )

    return setting, approval


async def _list_approval_settings(db: AsyncSession) -> list[ApprovalRequest]:
    result = await db.execute(
        select(UserSetting)
        .where(UserSetting.key.like(f"{APPROVAL_KEY_PREFIX}%"))
        .order_by(UserSetting.updated_at.desc())
    )
    approvals: list[ApprovalRequest] = []
    for setting in result.scalars().all():
        approval = _coerce_approval_request(setting.value)
        if approval is not None:
            approvals.append(approval)
    return approvals


class ApprovalCreate(BaseModel):
    """Payload for creating a new approval request."""

    agent_id: str
    session_id: str
    action_type: str
    payload: dict = {}


class ApprovalResolve(BaseModel):
    """Optional comment when approving or rejecting."""

    comment: Optional[str] = None


@router.post("", response_model=ApprovalRequest, status_code=status.HTTP_201_CREATED)
async def create_approval(
    body: ApprovalCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Submit a new approval request.

    Stored in the existing user_settings table so approvals survive process restarts.
    """
    req = ApprovalRequest(
        agent_id=body.agent_id,
        session_id=body.session_id,
        action_type=body.action_type,
        payload=body.payload,
        requester=user.email,
    )

    db.add(
        UserSetting(
            user_id=user.id,
            key=_approval_key(str(req.id)),
            value=req.model_dump(mode="json"),
        )
    )
    await db.commit()

    webhook_url = getattr(get_settings(), "approval_webhook_url", None)
    if webhook_url:
        await ApprovalService._send_webhook(webhook_url, req)

    logger.info(
        "Approval request created: id=%s agent_id=%s action=%s requester=%s",
        req.id,
        req.agent_id,
        req.action_type,
        req.requester,
    )
    return req


@router.get("", response_model=list[ApprovalRequest])
async def list_approvals(
    status_filter: Optional[ApprovalStatus] = Query(None, alias="status"),
    agent_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    List approval requests visible to the authenticated user.

    - ``status``: filter by status (e.g. PENDING)
    - ``agent_id``: filter by agent
    """
    approvals = await _list_approval_settings(db)
    visible_results = []
    for req in approvals:
        if status_filter is not None and req.status != status_filter:
            continue
        if status_filter is None and req.status != ApprovalStatus.PENDING:
            continue
        if agent_id is not None and req.agent_id != agent_id:
            continue
        try:
            _ensure_approval_visible(user, req)
        except HTTPException:
            continue
        visible_results.append(req)

    return visible_results


@router.get("/{request_id}", response_model=ApprovalRequest)
async def get_approval(
    request_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Fetch a single approval request by ID."""
    _, req = await _load_approval_setting(db, request_id)
    _ensure_approval_visible(user, req)
    return req


@router.post("/{request_id}/approve", response_model=ApprovalRequest)
async def approve_request(
    request_id: str,
    body: ApprovalResolve,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Approve a pending request.

    Requires DEVELOPER or ADMIN role unless the requester is approving their own request.
    """
    setting, approval = await _load_approval_setting(db, request_id)
    _ensure_approval_visible(user, approval)

    if not _has_approver_role(user) and approval.requester != user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the requester or an approver role can approve this request",
        )

    if approval.status != ApprovalStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot approve request in '{approval.status}' state",
        )

    approval.status = ApprovalStatus.APPROVED
    approval.approver = user.email
    approval.comment = body.comment
    approval.resolved_at = datetime.now(timezone.utc)
    setting.value = approval.model_dump(mode="json")
    await db.commit()

    logger.info("Approval request approved: id=%s approver=%s", request_id, user.email)
    return approval


@router.post("/{request_id}/reject", response_model=ApprovalRequest)
async def reject_request(
    request_id: str,
    body: ApprovalResolve,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Reject a pending request.

    Requires DEVELOPER or ADMIN role unless the requester is rejecting their own request.
    """
    setting, approval = await _load_approval_setting(db, request_id)
    _ensure_approval_visible(user, approval)

    if not _has_approver_role(user) and approval.requester != user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the requester or an approver role can reject this request",
        )

    if approval.status != ApprovalStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reject request in '{approval.status}' state",
        )

    approval.status = ApprovalStatus.REJECTED
    approval.approver = user.email
    approval.comment = body.comment
    approval.resolved_at = datetime.now(timezone.utc)
    setting.value = approval.model_dump(mode="json")
    await db.commit()

    logger.info("Approval request rejected: id=%s approver=%s", request_id, user.email)
    return approval
