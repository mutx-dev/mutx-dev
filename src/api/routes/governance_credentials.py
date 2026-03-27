"""
Credential broker API routes for MUTX governance.
"""

from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from src.api.config import get_settings
from src.api.middleware.auth import get_current_user
from src.api.models import User
from src.api.services.credential_broker import (
    CredentialBackend,
    get_credential_broker,
)

router = APIRouter(prefix="/v1/governance/credentials", tags=["governance"])


class CredentialBackendRegister(BaseModel):
    name: str
    backend: str
    path: str
    ttl: Optional[int] = 900
    config: Optional[dict] = {}


class CredentialResponse(BaseModel):
    name: str
    backend: str
    path: str
    value: str
    expires_at: Optional[str] = None
    metadata: dict = {}


class BackendHealthResponse(BaseModel):
    name: str
    backend: str
    path: str
    ttl: int
    is_active: bool
    is_healthy: bool


def _assert_internal_user(current_user: User) -> None:
    """Restrict credential broker access to internal/admin users."""
    if not current_user.is_email_verified:
        raise HTTPException(status_code=403, detail="Forbidden")

    settings = get_settings()
    allowed_domains = {
        domain.strip().lower()
        for domain in settings.internal_user_email_domains
        if domain and domain.strip()
    }
    user_domain = current_user.email.rsplit("@", 1)[-1].lower() if "@" in current_user.email else ""
    if user_domain not in allowed_domains:
        raise HTTPException(status_code=403, detail="Forbidden")


@router.get("/backends", response_model=list[BackendHealthResponse])
async def list_credential_backends(
    current_user: User = Depends(get_current_user),
):
    """List all registered credential backends."""
    _assert_internal_user(current_user)
    broker = get_credential_broker()
    backends = await broker.list_backends()
    return [
        BackendHealthResponse(
            name=b["name"],
            backend=b["backend"],
            path=b["path"],
            ttl=b["ttl"],
            is_active=b["is_active"],
            is_healthy=b["is_healthy"],
        )
        for b in backends
    ]


@router.post("/backends", status_code=201)
async def register_credential_backend(
    request: CredentialBackendRegister,
    current_user: User = Depends(get_current_user),
):
    """Register a new credential backend."""
    _assert_internal_user(current_user)
    try:
        backend_enum = CredentialBackend(request.backend)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid backend type: {request.backend}. "
            f"Supported: vault, awssecrets, gcpsm, azurekv, onepassword, infisical",
        )

    broker = get_credential_broker()
    success = await broker.register_backend(
        name=request.name,
        backend=backend_enum,
        path=request.path,
        ttl=timedelta(seconds=request.ttl),
        config=request.config,
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to register backend")

    return {"status": "registered", "name": request.name}


@router.delete("/backends/{backend_name}")
async def unregister_credential_backend(
    backend_name: str,
    current_user: User = Depends(get_current_user),
):
    """Unregister a credential backend."""
    _assert_internal_user(current_user)
    broker = get_credential_broker()
    success = await broker.unregister_backend(backend_name)

    if not success:
        raise HTTPException(status_code=404, detail=f"Backend '{backend_name}' not found")

    return {"status": "unregistered", "name": backend_name}


@router.get("/backends/{backend_name}/health")
async def check_backend_health(
    backend_name: str,
    current_user: User = Depends(get_current_user),
):
    """Check health of a specific credential backend."""
    _assert_internal_user(current_user)
    broker = get_credential_broker()
    backends = await broker.list_backends()

    for backend in backends:
        if backend["name"] == backend_name:
            return {
                "name": backend_name,
                "healthy": backend["is_healthy"],
                "backend": backend["backend"],
            }

    raise HTTPException(status_code=404, detail=f"Backend '{backend_name}' not found")


@router.get("/health")
async def check_all_backends_health(
    current_user: User = Depends(get_current_user),
):
    """Check health of all credential backends."""
    _assert_internal_user(current_user)
    broker = get_credential_broker()
    return await broker.health_check()


@router.get("/get/{full_path:path}", response_model=CredentialResponse)
async def get_credential(
    full_path: str,
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve a credential by its full path.

    Path format: backend:/path/to/secret
    Examples:
        vault:/secret/myapp/api-key
        awssecrets:/prod/myapp/api-key
        gcpsm:/my-project/my-secret
    """
    _assert_internal_user(current_user)
    broker = get_credential_broker()
    credential = await broker.get_credential_by_path(full_path)

    if not credential:
        raise HTTPException(status_code=404, detail=f"Credential not found: {full_path}")

    return CredentialResponse(
        name=credential.name,
        backend=credential.backend,
        path=credential.path,
        value=credential.value,
        expires_at=credential.expires_at.isoformat() if credential.expires_at else None,
        metadata=credential.metadata,
    )
