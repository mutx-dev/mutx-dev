import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.models.models import Lead, Plan


@pytest.mark.asyncio
async def test_capture_lead_success(client: AsyncClient, db_session: AsyncSession):
    """Test capturing a lead successfully."""
    response = await client.post(
        "/leads",
        json={
            "email": "lead@example.com",
            "name": "Lead Name",
            "company": "Lead Co",
            "message": "Hello, I am interested.",
            "source": "onboarding",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "lead@example.com"
    assert data["name"] == "Lead Name"
    assert data["company"] == "Lead Co"
    assert data["message"] == "Hello, I am interested."
    assert data["source"] == "onboarding"
    assert "id" in data


@pytest.mark.asyncio
async def test_capture_lead_minimal(client: AsyncClient):
    """Test capturing a lead with minimal data."""
    response = await client.post(
        "/leads",
        json={
            "email": "minimal@example.com",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "minimal@example.com"
    assert data["source"] == "direct"  # Default value


@pytest.mark.asyncio
async def test_list_leads_authenticated(client: AsyncClient, test_user, db_session: AsyncSession):
    """Test listing leads requires an internal user tier."""
    test_user.plan = Plan.PRO
    db_session.add(test_user)
    await db_session.commit()

    response = await client.get("/leads")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_list_leads_forbidden_for_free_plan(client: AsyncClient, test_user, db_session: AsyncSession):
    """Test free-tier users cannot access lead management list."""
    test_user.plan = Plan.FREE
    db_session.add(test_user)
    await db_session.commit()

    response = await client.get("/leads")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_leads_unauthorized(client_no_auth: AsyncClient):
    """Test listing leads without auth fails."""
    response = await client_no_auth.get("/leads")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_lead_authenticated(client: AsyncClient, test_user, db_session: AsyncSession):
    """Test fetching a single lead when authenticated as internal user."""
    test_user.plan = Plan.PRO
    db_session.add(test_user)
    await db_session.commit()

    lead = Lead(
        email="reader@example.com",
        name="Reader",
        company="Read Co",
        message="Tell me more.",
        source="docs",
    )
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    response = await client.get(f"/leads/{lead.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(lead.id)
    assert data["email"] == "reader@example.com"


@pytest.mark.asyncio
async def test_get_lead_forbidden_for_free_plan(client: AsyncClient, test_user, db_session: AsyncSession):
    """Test free-tier users cannot access a lead by id."""
    test_user.plan = Plan.FREE
    db_session.add(test_user)
    await db_session.commit()

    lead = Lead(email="private@example.com", source="homepage")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    response = await client.get(f"/leads/{lead.id}")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_lead_unauthorized(client_no_auth: AsyncClient, db_session: AsyncSession):
    """Test fetching a single lead without auth fails."""
    lead = Lead(email="private@example.com", source="homepage")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    response = await client_no_auth.get(f"/leads/{lead.id}")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_lead_not_found(client: AsyncClient, test_user, db_session: AsyncSession):
    """Test fetching an unknown lead returns 404 for internal users."""
    test_user.plan = Plan.PRO
    db_session.add(test_user)
    await db_session.commit()

    response = await client.get("/leads/00000000-0000-0000-0000-999999999999")
    assert response.status_code == 404
