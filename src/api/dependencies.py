"""
API Dependencies for authentication and authorization.

Provides FastAPI dependencies for JWT-based authentication
and role-based access control (RBAC).
"""

from typing import Callable

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer

from src.api.config import get_settings
from src.api.services.auth import Role, TokenPayload, check_role, verify_access_token

settings = get_settings()
security = HTTPBearer(auto_error=False)


class SSOTokenUser:
    """Lightweight user object derived from SSO token."""
    def __init__(self, token_payload: TokenPayload):
        self.id = token_payload.sub
        self.email = token_payload.email
        self.name = token_payload.email.split("@")[0] if token_payload.email else "SSO User"
        self.roles = token_payload.roles
        self.is_active = True
        self.is_email_verified = True
    
    def __repr__(self):
        return f"<SSOTokenUser(id={self.id}, email={self.email}, roles={self.roles})>"


async def get_current_user(
    authorization: str | None = Header(None, alias="Authorization"),
) -> SSOTokenUser:
    """
    Extract and verify the current user from JWT Bearer token.
    
    This dependency extracts the Bearer token from the Authorization header,
    verifies it using the configured JWT secret, and returns the user info.
    
    For integration with the existing User model, we validate that a user
    with the token's subject (sub) exists and is active.
    
    Args:
        authorization: Authorization header value (Bearer <token>)
        
    Returns:
        User object for the authenticated user
        
    Raises:
        HTTPException 401: If token is missing, invalid, or expired
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extract Bearer token
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = parts[1]
    
    try:
        # Verify the JWT and extract payload
        payload = verify_access_token(token, settings.jwt_secret)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return SSOTokenUser(payload)


def require_role(roles: list[str]) -> Callable:
    """
    Create a dependency that checks if the user has one of the required roles.
    
    This factory creates a dependency that, when called, verifies the current
    user has at least one of the specified roles. If the user lacks the
    required role, it raises HTTPException 403 Forbidden.
    
    Args:
        roles: List of role names that grant access (e.g., ["ADMIN", "DEVELOPER"])
        
    Returns:
        A callable dependency function
        
    Example:
        @router.get("/admin", dependencies=[Depends(require_role(["ADMIN"]))])
        async def admin_endpoint():
            return {"message": "Admin only"}
    """
    async def role_checker(
        current_user: SSOTokenUser = Depends(get_current_user),
    ) -> SSOTokenUser:
        user_roles = getattr(current_user, "roles", [])
        if not user_roles:
            user_roles = []
        
        required_role_enums = []
        for role_name in roles:
            try:
                required_role_enums.append(Role(role_name.upper()))
            except ValueError:
                # If not a valid Role enum, treat as string
                pass
        
        if not check_role(user_roles, required_role_enums):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {roles}",
            )
        
        return current_user
    
    return role_checker


def require_roles(*roles: str) -> Callable:
    """
    Convenience decorator for requiring specific roles.
    
    Args:
        *roles: Role names that grant access
        
    Example:
        @router.get("/billing")
        @Depends(require_roles("ADMIN", "DEVELOPER"))
        async def billing_endpoint():
            return {"message": "Billing access"}
    """
    return require_role(list(roles))
