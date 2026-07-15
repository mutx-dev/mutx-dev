"""Deprecated compatibility imports for the canonical auth dependency facade."""

from src.api.auth.dependencies import (
    SSOTokenUser,
    get_current_sso_user as get_current_user,
    require_role,
    require_roles,
)

__all__ = ["SSOTokenUser", "get_current_user", "require_role", "require_roles"]
