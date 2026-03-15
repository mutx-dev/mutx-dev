from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.database import get_db
from src.api.models.models import User
from src.api.services.user_service import UserService
from src.api.middleware.auth import get_current_user
from src.api.auth.jwt import (
    create_access_token,
    create_refresh_token,
    refresh_access_token,
)
from src.api.auth.password import validate_password_strength
from src.api.services.email.email_service import (
    send_verification_email,
    send_password_reset_email,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def _get_expires_in_seconds(expires_at: datetime) -> int:
    return max(0, int((expires_at - datetime.now(timezone.utc)).total_seconds()))


class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    plan: str
    api_key: Optional[str]
    created_at: datetime
    is_active: bool
    is_email_verified: bool = False

    model_config = ConfigDict(from_attributes=True)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, session: AsyncSession = Depends(get_db)):
    user_service = UserService(session)

    existing_user = await user_service.get_user_by_email(request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    is_valid, error_message = validate_password_strength(request.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message,
        )

    user = await user_service.create_user(
        email=request.email,
        name=request.name,
        password=request.password,
    )

    # Send verification email
    token = await user_service.create_email_verification_token(user.id)
    send_verification_email(user.email, user.name, token)

    access_token, access_token_expires_at = create_access_token(user.id)
    refresh_token, _ = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=_get_expires_in_seconds(access_token_expires_at),
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, session: AsyncSession = Depends(get_db)):
    user_service = UserService(session)

    user = await user_service.authenticate_user(request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    # Check if email is verified (optional - can be enabled by setting REQUIRE_EMAIL_VERIFICATION)
    # For now, we'll allow login but warn if not verified

    access_token, access_token_expires_at = create_access_token(user.id)
    refresh_token, _ = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=_get_expires_in_seconds(access_token_expires_at),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(request: RefreshRequest, session: AsyncSession = Depends(get_db)):
    result = await refresh_access_token(request.refresh_token, session)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    access_token, access_token_expires_at, new_refresh_token = result
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        expires_in=_get_expires_in_seconds(access_token_expires_at),
    )


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.name,
        plan=current_user.plan.value,
        api_key=current_user.api_key,
        created_at=current_user.created_at,
        is_active=current_user.is_active,
        is_email_verified=current_user.is_email_verified,
    )


# New request models for password reset and email verification
class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class VerifyEmailRequest(BaseModel):
    token: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class MessageResponse(BaseModel):
    message: str


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(request: ForgotPasswordRequest, session: AsyncSession = Depends(get_db)):
    """Request a password reset email."""
    user_service = UserService(session)

    user = await user_service.get_user_by_email(request.email)
    if user:
        # Only send email if user exists (don't reveal if email exists)
        # Create reset token
        token = await user_service.create_password_reset_token(user.id)
        # Send email
        send_password_reset_email(user.email, user.name, token)

    # Always return success to prevent email enumeration
    return MessageResponse(
        message="If an account exists with this email, a password reset link has been sent"
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(request: ResetPasswordRequest, session: AsyncSession = Depends(get_db)):
    """Reset password using token."""
    user_service = UserService(session)

    # Validate password strength
    is_valid, error_message = validate_password_strength(request.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message,
        )

    # Reset password
    user = await user_service.reset_password(request.token, request.new_password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    return MessageResponse(message="Password has been reset successfully")


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(request: VerifyEmailRequest, session: AsyncSession = Depends(get_db)):
    """Verify email with token."""
    user_service = UserService(session)

    user = await user_service.verify_email(request.token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )

    return MessageResponse(message="Email has been verified successfully")


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(
    request: ResendVerificationRequest, session: AsyncSession = Depends(get_db)
):
    """Resend verification email."""
    user_service = UserService(session)

    user = await user_service.get_user_by_email(request.email)
    if not user:
        # Don't reveal if email exists
        return MessageResponse(
            message="If an account exists and is not verified, a verification email has been sent"
        )

    if user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already verified",
        )

    # Create new verification token
    token = await user_service.create_email_verification_token(user.id)
    # Send email
    send_verification_email(user.email, user.name, token)

    return MessageResponse(message="Verification email has been sent")
