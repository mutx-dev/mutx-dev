"""
Approval workflow REST endpoints.
"""

import logging
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from src.api.middleware.auth import get_current_user
from src.api.models import User
from src.api.services.approval import (
    ApprovalRequest,
    ApprovalService,
    ApprovalStatus,
    get_approval_service,
)

router = APIRouter(prefix="/approvals", tags=["approvals"])
logger = logging.getLogger(__name__)

# Roles that are allowed to approve/reject requests
APPROVER_ROLES = {"DEVELOPER", "ADMIN"}


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


# ------------------------------------------------------------------
# Request body schemas (defined here to keep route handlers clean)
# ------------------------------------------------------------------


class ApprovalCreate(BaseModel):
    """Payload for creating a new approval request."""

    agent_id: str
    session_id: str
    action_type: str
    payload: dict = {}


class ApprovalResolve(BaseModel):
    """Optional comment when approving or rejecting."""

    comment: Optional[str] = None


# ------------------------------------------------------------------
# Routes
# ------------------------------------------------------------------


@router.post("", response_model=ApprovalRequest, status_code=status.HTTP_201_CREATED)
async def create_approval(
    body: ApprovalCreate,
    service: Annotated[ApprovalService, Depends(get_approval_service)],
    user: Annotated[User, Depends(get_current_user)],
):
    """
    Submit a new approval request.

    The requesting user's email is recorded as the ``requester``.
    """
    req = ApprovalRequest(
        agent_id=body.agent_id,
        session_id=body.session_id,
        action_type=body.action_type,
        payload=body.payload,
        requester=user.email,
    )
    return await service.request_approval(req)


@router.get("", response_model=list[ApprovalRequest])
async def list_approvals(
    service: Annotated[ApprovalService, Depends(get_approval_service)],
    user: Annotated[User, Depends(get_current_user)],
    status_filter: Optional[ApprovalStatus] = Query(None, alias="status"),
    agent_id: Optional[str] = None,
):
    """
    List approval requests visible to the authenticated user.

    - ``status``: filter by status (e.g. PENDING)
    - ``agent_id``: filter by agent
    """
    async with service._lock:
        results = list(service._store.values())

    visible_results = []
    for req in results:
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
    service: Annotated[ApprovalService, Depends(get_approval_service)],
    user: Annotated[User, Depends(get_current_user)],
):
    """Fetch a single approval request by ID."""
    # Access internal store for O(1) lookup
    async with service._lock:
        req = service._store.get(request_id)

    if req is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Approval request not found"
        )
    _ensure_approval_visible(user, req)
    return req


@router.post("/{request_id}/approve", response_model=ApprovalRequest)
async def approve_request(
    request_id: str,
    body: ApprovalResolve,
    service: Annotated[ApprovalService, Depends(get_approval_service)],
    user: Annotated[User, Depends(get_current_user)],
):
    """
    Approve a pending request.

    Requires DEVELOPER or ADMIN role (enforced when RBAC is active).
    """
    approval = await get_approval(request_id=request_id, service=service, user=user)
    if not _has_approver_role(user) and approval.requester != user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the requester or an approver role can approve this request",
        )
    try:
        return await service.approve(
            request_id=request_id,
            approver=user.email,
            comment=body.comment,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/{request_id}/reject", response_model=ApprovalRequest)
async def reject_request(
    request_id: str,
    body: ApprovalResolve,
    service: Annotated[ApprovalService, Depends(get_approval_service)],
    user: Annotated[User, Depends(get_current_user)],
):
    """
    Reject a pending request.

    Requires DEVELOPER or ADMIN role (enforced when RBAC is active).
    """
    approval = await get_approval(request_id=request_id, service=service, user=user)
    if not _has_approver_role(user) and approval.requester != user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the requester or an approver role can reject this request",
        )
    try:
        return await service.reject(
            request_id=request_id,
            approver=user.email,
            comment=body.comment,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
