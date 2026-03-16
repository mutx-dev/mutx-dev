import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from passlib.exc import UnknownHashError
from passlib.context import CryptContext
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.auth.password import hash_password, verify_password
from src.api.models.models import User, APIKey, Plan
from src.api.services.email.email_service import (
    generate_token,
    PASSWORD_RESET_TOKEN_EXPIRE_HOURS,
)

api_key_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def generate_api_key() -> str:
    return f"mutx_{secrets.token_urlsafe(32)}"


def generate_user_api_key() -> str:
    return secrets.token_urlsafe(32)


def hash_api_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


def verify_api_key(plain_key: str, hashed_key: str) -> bool:
    if secrets.compare_digest(hash_api_key(plain_key), hashed_key):
        return True

    try:
        return api_key_context.verify(plain_key, hashed_key)
    except (UnknownHashError, ValueError):
        return False


class UserService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_user(
        self,
        email: str,
        name: str,
        password: Optional[str] = None,
        plan: Plan = Plan.FREE,
    ) -> User:
        password_hash = None
        if password:
            password_hash = hash_password(password)

        user = User(
            id=uuid.uuid4(),
            email=email,
            name=name,
            password_hash=password_hash,
            plan=plan,
            api_key=generate_user_api_key(),
        )
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def get_user_by_email(self, email: str) -> Optional[User]:
        result = await self.session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_user_by_id(self, user_id: uuid.UUID) -> Optional[User]:
        result = await self.session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_user_by_api_key(self, api_key: str) -> Optional[User]:
        result = await self.session.execute(select(User).where(User.api_key == api_key))
        return result.scalar_one_or_none()

    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        user = await self.get_user_by_email(email)
        if not user or not user.password_hash:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    async def update_user_plan(self, user_id: uuid.UUID, plan: Plan) -> User:
        await self.session.execute(
            update(User)
            .where(User.id == user_id)
            .values(plan=plan, updated_at=datetime.now(timezone.utc))
        )
        await self.session.commit()
        user = await self.get_user_by_id(user_id)
        return user

    async def regenerate_user_api_key(self, user_id: uuid.UUID) -> str:
        new_key = generate_user_api_key()
        await self.session.execute(
            update(User)
            .where(User.id == user_id)
            .values(api_key=new_key, updated_at=datetime.now(timezone.utc))
        )
        await self.session.commit()
        return new_key

    async def create_api_key(
        self,
        user_id: uuid.UUID,
        name: str,
        expires_in_days: Optional[int] = None,
    ) -> tuple[APIKey, str]:
        plain_key = generate_api_key()
        key_hash = hash_api_key(plain_key)

        expires_at = None
        if expires_in_days:
            expires_at = datetime.now(timezone.utc) + timedelta(days=expires_in_days)

        api_key = APIKey(
            id=uuid.uuid4(),
            user_id=user_id,
            key_hash=key_hash,
            name=name,
            expires_at=expires_at,
        )
        self.session.add(api_key)
        await self.session.commit()
        await self.session.refresh(api_key)
        return api_key, plain_key

    async def get_user_api_keys(self, user_id: uuid.UUID) -> list[APIKey]:
        result = await self.session.execute(
            select(APIKey).where(APIKey.user_id == user_id).where(APIKey.is_active)
        )
        return list(result.scalars().all())

    async def verify_api_key(self, plain_key: str, user_id: uuid.UUID) -> Optional[APIKey]:
        result = await self.session.execute(
            select(APIKey).where(APIKey.user_id == user_id).where(APIKey.is_active)
        )
        api_keys = result.scalars().all()

        for api_key in api_keys:
            if verify_api_key(plain_key, api_key.key_hash):
                if api_key.expires_at and api_key.expires_at < datetime.now(timezone.utc).replace(
                    tzinfo=None
                ):
                    return None
                await self.update_api_key_last_used(api_key.id)
                return api_key
        return None

    async def get_user_for_api_key(self, plain_key: str) -> Optional[User]:
        """Resolve an active user for either legacy user API keys or managed APIKey records."""
        user = await self.get_user_by_api_key(plain_key)
        if user and user.is_active:
            return user

        result = await self.session.execute(select(User).where(User.is_active))
        users = result.scalars().all()

        for active_user in users:
            api_key = await self.verify_api_key(plain_key, active_user.id)
            if api_key:
                return active_user

        return None

    async def update_api_key_last_used(self, api_key_id: uuid.UUID) -> None:
        await self.session.execute(
            update(APIKey)
            .where(APIKey.id == api_key_id)
            .values(last_used=datetime.now(timezone.utc))
        )
        await self.session.commit()

    async def deactivate_api_key(self, api_key_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        result = await self.session.execute(
            update(APIKey)
            .where(APIKey.id == api_key_id)
            .where(APIKey.user_id == user_id)
            .values(is_active=False)
        )
        await self.session.commit()
        return result.rowcount > 0

    async def check_plan_limits(self, user_id: uuid.UUID, resource: str) -> bool:
        user = await self.get_user_by_id(user_id)
        if not user:
            return False

        plan_limits = {
            Plan.FREE: {"agents": 3, "deployments": 5, "api_keys": 2},
            Plan.STARTER: {"agents": 10, "deployments": 20, "api_keys": 10},
            Plan.PRO: {"agents": 50, "deployments": 100, "api_keys": 50},
            Plan.ENTERPRISE: {"agents": -1, "deployments": -1, "api_keys": -1},
        }

        limit = plan_limits.get(user.plan, {}).get(resource, 0)
        if limit == -1:
            return True
        return True

    async def deactivate_user(self, user_id: uuid.UUID) -> bool:
        result = await self.session.execute(
            update(User)
            .where(User.id == user_id)
            .values(is_active=False, updated_at=datetime.now(timezone.utc))
        )
        await self.session.commit()
        return result.rowcount > 0

    # Email verification methods
    async def create_email_verification_token(self, user_id: uuid.UUID) -> str:
        """Create and store an email verification token."""
        token = generate_token()
        await self.session.execute(
            update(User).where(User.id == user_id).values(email_verification_token=token)
        )
        await self.session.commit()
        return token

    async def verify_email(self, token: str) -> Optional[User]:
        """Verify email with token. Returns user if successful."""
        result = await self.session.execute(
            select(User).where(User.email_verification_token == token)
        )
        user = result.scalar_one_or_none()
        if not user:
            return None

        # Update user as verified
        await self.session.execute(
            update(User)
            .where(User.id == user.id)
            .values(
                is_email_verified=True,
                email_verified_at=datetime.now(timezone.utc),
                email_verification_token=None,
            )
        )
        await self.session.commit()

        # Refresh user
        await self.session.refresh(user)
        return user

    async def get_user_by_verification_token(self, token: str) -> Optional[User]:
        """Get user by verification token (without verifying)."""
        result = await self.session.execute(
            select(User).where(User.email_verification_token == token)
        )
        return result.scalar_one_or_none()

    # Password reset methods
    async def create_password_reset_token(self, user_id: uuid.UUID) -> str:
        """Create and store a password reset token."""
        token = generate_token()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=PASSWORD_RESET_TOKEN_EXPIRE_HOURS)
        await self.session.execute(
            update(User)
            .where(User.id == user_id)
            .values(
                password_reset_token=token,
                password_reset_expires_at=expires_at,
            )
        )
        await self.session.commit()
        return token

    async def reset_password(self, token: str, new_password: str) -> Optional[User]:
        """Reset password with token. Returns user if successful."""
        result = await self.session.execute(select(User).where(User.password_reset_token == token))
        user = result.scalar_one_or_none()

        if not user:
            return None

        # Check if token is expired
        if user.password_reset_expires_at and user.password_reset_expires_at < datetime.now(
            timezone.utc
        ).replace(tzinfo=None):
            return None

        # Update password and clear reset token
        password_hash = hash_password(new_password)
        await self.session.execute(
            update(User)
            .where(User.id == user.id)
            .values(
                password_hash=password_hash,
                password_reset_token=None,
                password_reset_expires_at=None,
            )
        )
        await self.session.commit()

        # Refresh user
        await self.session.refresh(user)
        return user

    async def get_user_by_password_reset_token(self, token: str) -> Optional[User]:
        """Get user by password reset token (without resetting)."""
        result = await self.session.execute(select(User).where(User.password_reset_token == token))
        return result.scalar_one_or_none()

    async def clear_password_reset_token(self, user_id: uuid.UUID) -> None:
        """Clear password reset token without changing password."""
        await self.session.execute(
            update(User)
            .where(User.id == user_id)
            .values(
                password_reset_token=None,
                password_reset_expires_at=None,
            )
        )
        await self.session.commit()
