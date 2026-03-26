import bcrypt
import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.auth.password import hash_password, verify_password
from src.api.config import get_settings
from src.api.models.models import User, APIKey, Plan, Agent, Deployment, RefreshTokenSession
from src.api.security import hash_token_value
from src.api.services.email.email_service import (
    generate_token,
    PASSWORD_RESET_TOKEN_EXPIRE_HOURS,
)

settings = get_settings()


def generate_api_key() -> str:
    return f"mutx_{secrets.token_urlsafe(32)}"


def generate_user_api_key() -> str:
    return secrets.token_urlsafe(32)


def hash_api_key(key: str) -> str:
    # Use bcrypt for API key hashing
    # Truncate to 72 bytes (bcrypt limitation)
    return bcrypt.hashpw(key[:72].encode(), bcrypt.gensalt()).decode()


def verify_api_key(plain_key: str, hashed_key: str) -> bool:
    # Legacy SHA256 check (for old keys created before bcrypt migration)
    # SHA256 hashes are 64 hex chars = 64 bytes
    if len(hashed_key) == 64:
        sha256_hash = hashlib.sha256(plain_key.encode()).hexdigest()
        if secrets.compare_digest(sha256_hash, hashed_key):
            return True
    if not hashed_key.startswith("$2"):
        return secrets.compare_digest(plain_key, hashed_key)
    # bcrypt verification - truncate to 72 bytes (bcrypt limitation)
    try:
        return bcrypt.checkpw(plain_key[:72].encode(), hashed_key.encode())
    except (ValueError, TypeError):
        return False


def _as_utc_datetime(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


class UserService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_user(
        self,
        email: str,
        name: str,
        password: Optional[str] = None,
        plan: str = "FREE",
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
        )
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def get_or_create_local_bootstrap_user(
        self,
        *,
        email: str,
        name: str,
    ) -> User:
        user = await self.get_user_by_email(email)
        now = datetime.now(timezone.utc)

        if user is None:
            user = User(
                id=uuid.uuid4(),
                email=email,
                name=name,
                password_hash=None,
                plan="FREE",
                is_active=True,
                is_email_verified=True,
                email_verified_at=now,
            )
            self.session.add(user)
            await self.session.commit()
            await self.session.refresh(user)
            return user

        changed = False

        if user.name != name:
            user.name = name
            changed = True
        if not user.is_active:
            user.is_active = True
            changed = True
        if not user.is_email_verified:
            user.is_email_verified = True
            user.email_verified_at = now
            user.email_verification_token = None
            user.email_verification_expires_at = None
            changed = True

        if changed:
            user.updated_at = now
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
                if api_key.expires_at and api_key.expires_at < datetime.now(timezone.utc):
                    return None
                await self.update_api_key_last_used(api_key.id)
                return api_key
        return None

    async def get_user_for_api_key(self, plain_key: str) -> Optional[User]:
        """Resolve an active user for a managed API key."""
        auth_context = await self.authenticate_api_key(plain_key)
        return auth_context[0] if auth_context else None

    async def authenticate_api_key(self, plain_key: str) -> Optional[tuple[User, uuid.UUID | None]]:
        """Authenticate managed API keys.

        Returns the active user and a managed API key ID when present.
        """
        now = datetime.now(timezone.utc)
        result = await self.session.execute(
            select(APIKey, User)
            .join(User, APIKey.user_id == User.id)
            .where(APIKey.is_active, User.is_active)
        )
        managed_keys = result.all()

        for api_key, active_user in managed_keys:
            if api_key.expires_at and api_key.expires_at < now:
                continue

            if verify_api_key(plain_key, api_key.key_hash):
                await self.update_api_key_last_used(api_key.id)
                return active_user, api_key.id

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
        """Check if user has not exceeded their plan limits for a given resource.

        Returns True if under the limit (or unlimited), False if over the limit or user not found.
        """
        user = await self.get_user_by_id(user_id)
        if not user:
            return False

        plan_limits = {
            "FREE": {"agents": 3, "deployments": 5, "api_keys": 2},
            "STARTER": {"agents": 10, "deployments": 20, "api_keys": 10},
            "PRO": {"agents": 50, "deployments": 100, "api_keys": 50},
            "ENTERPRISE": {"agents": -1, "deployments": -1, "api_keys": -1},
        }

        limit = plan_limits.get(user.plan, {}).get(resource, 0)
        if limit == -1:
            return True  # Unlimited

        # Count current usage
        if resource == "agents":
            result = await self.session.execute(
                select(func.count()).select_from(Agent).where(Agent.user_id == user_id)
            )
            current_count = result.scalar() or 0
        elif resource == "deployments":
            result = await self.session.execute(
                select(func.count()).select_from(Deployment).where(Deployment.user_id == user_id)
            )
            current_count = result.scalar() or 0
        elif resource == "api_keys":
            result = await self.session.execute(
                select(func.count())
                .select_from(APIKey)
                .where(APIKey.user_id == user_id, APIKey.is_active)
            )
            current_count = result.scalar() or 0
        else:
            return True  # Unknown resource, allow

        return current_count < limit

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
        expires_at = datetime.now(timezone.utc) + timedelta(
            hours=settings.email_verification_token_expire_hours
        )
        await self.session.execute(
            update(User)
            .where(User.id == user_id)
            .values(
                email_verification_token=hash_token_value(token),
                email_verification_expires_at=expires_at,
            )
        )
        await self.session.commit()
        return token

    async def verify_email(self, token: str) -> Optional[User]:
        """Verify email with token. Returns user if successful."""
        result = await self.session.execute(
            select(User).where(User.email_verification_token == hash_token_value(token))
        )
        user = result.scalar_one_or_none()
        if not user:
            return None

        now = datetime.now(timezone.utc)
        if (
            _as_utc_datetime(user.email_verification_expires_at)
            and _as_utc_datetime(user.email_verification_expires_at) < now
        ):
            await self.session.execute(
                update(User)
                .where(User.id == user.id)
                .values(
                    email_verification_token=None,
                    email_verification_expires_at=None,
                )
            )
            await self.session.commit()
            return None

        # Update user as verified
        await self.session.execute(
            update(User)
            .where(User.id == user.id)
            .values(
                is_email_verified=True,
                email_verified_at=now,
                email_verification_token=None,
                email_verification_expires_at=None,
            )
        )
        await self.session.commit()

        # Refresh user
        await self.session.refresh(user)
        return user

    async def get_user_by_verification_token(self, token: str) -> Optional[User]:
        """Get user by verification token (without verifying)."""
        result = await self.session.execute(
            select(User).where(User.email_verification_token == hash_token_value(token))
        )
        user = result.scalar_one_or_none()
        if not user:
            return None

        expires_at = _as_utc_datetime(user.email_verification_expires_at)
        if expires_at and expires_at < datetime.now(timezone.utc):
            await self.session.execute(
                update(User)
                .where(User.id == user.id)
                .values(
                    email_verification_token=None,
                    email_verification_expires_at=None,
                )
            )
            await self.session.commit()
            return None

        return user

    # Password reset methods
    async def create_password_reset_token(self, user_id: uuid.UUID) -> str:
        """Create and store a password reset token."""
        token = generate_token()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=PASSWORD_RESET_TOKEN_EXPIRE_HOURS)
        await self.session.execute(
            update(User)
            .where(User.id == user_id)
            .values(
                password_reset_token=hash_token_value(token),
                password_reset_expires_at=expires_at,
            )
        )
        await self.session.commit()
        return token

    async def reset_password(self, token: str, new_password: str) -> Optional[User]:
        """Reset password with token. Returns user if successful."""
        result = await self.session.execute(
            select(User).where(User.password_reset_token == hash_token_value(token))
        )
        user = result.scalar_one_or_none()

        if not user:
            return None

        # Check if token is expired
        if user.password_reset_expires_at and user.password_reset_expires_at < datetime.now(
            timezone.utc
        ):
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
        result = await self.session.execute(
            select(User).where(User.password_reset_token == hash_token_value(token))
        )
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

    async def revoke_all_refresh_tokens(self, user_id: uuid.UUID) -> None:
        now = datetime.now(timezone.utc)
        await self.session.execute(
            update(RefreshTokenSession)
            .where(
                RefreshTokenSession.user_id == user_id,
                RefreshTokenSession.revoked_at.is_(None),
            )
            .values(revoked_at=now)
        )
        await self.session.commit()
