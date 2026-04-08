import os

import pytest

os.environ.setdefault("DATABASE_REQUIRED_ON_STARTUP", "false")
os.environ["JWT_SECRET"] = "test-secret-key-that-is-at-least-32-characters"

from src.api.models.models import Plan
from src.api.services.user_service import UserService


@pytest.mark.asyncio
async def test_update_user_plan_persists_uppercase_name(db_session, test_user):
    service = UserService(db_session)

    updated_user = await service.update_user_plan(test_user.id, Plan.PRO)

    assert updated_user is not None
    assert updated_user.plan == "PRO"


@pytest.mark.asyncio
async def test_check_plan_limits_normalizes_stored_plan_case(db_session, test_user):
    service = UserService(db_session)

    test_user.plan = "pro"
    db_session.add(test_user)
    await db_session.commit()

    allowed = await service.check_plan_limits(test_user.id, "agents")

    assert allowed is True
