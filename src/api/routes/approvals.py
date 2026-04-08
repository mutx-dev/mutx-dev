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


def _check_approver_role(user: User) -> None:
    """
    Verify the authenticated user has an approver role.

    When the RBAC system (Prompt 6) is live, user.role will be populated.
    Until then we allow any authenticated user through and rely on the
    RBAC integration to enforce restrictions retroactively.
    """
    role: Optional[str] = getattr(user, "role", None)
    if role is not None and role not in APPROVER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{role}' is not authorized to manage approvals",
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
    if status_filter is not None:
        # Filter by explicit status — walk the full store
        async with service._lock:
            results = [
                req
                for req in service._store.values()
                if req.status == status_filter
                and (agent_id is None or req.agent_id == agent_id)
            ]
            return results

    return await service.list_pending(agent_id=agent_id)


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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval request not found")
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
    _check_approver_role(user)
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
    _check_approver_role(user)
    try:
        return await service.reject(
            request_id=request_id,
            approver=user.email,
            comment=body.comment,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
