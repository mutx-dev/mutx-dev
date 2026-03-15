"""Tests for password reset token handling."""

from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.services.user_service import UserService


class TestPasswordResetExpiration:
    """Tests for password reset expiration comparisons."""

    @pytest.mark.asyncio
    async def test_reset_password_handles_naive_expiration_datetime(
        self, db_session: AsyncSession, test_user
    ):
        """Naive expiration timestamps from DB should not crash password reset."""
        service = UserService(db_session)
        token = await service.create_password_reset_token(test_user.id)

        test_user.password_reset_token = token
        test_user.password_reset_expires_at = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=1)
        await db_session.commit()

        result = await service.reset_password(token, "new-password")

        assert result is None
