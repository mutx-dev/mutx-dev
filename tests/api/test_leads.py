import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.models.models import Lead


@pytest.mark.asyncio
async def test_capture_lead_success(client: AsyncClient, db_session: AsyncSession):
    """Test capturing a lead successfully."""
    response = await client.post(
        "/v1/leads",
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
        "/v1/leads",
        json={
            "email": "minimal@example.com",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "minimal@example.com"
    assert data["source"] == "direct"  # Default value


@pytest.mark.asyncio
async def test_capture_contact_alias_success(client: AsyncClient):
    """Test /contacts alias captures leads."""
    response = await client.post(
        "/v1/contacts",
        json={
            "email": "contact@example.com",
            "name": "Contact Name",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "contact@example.com"
    assert data["name"] == "Contact Name"


@pytest.mark.asyncio
async def test_list_leads_internal_user(client: AsyncClient, test_user):
    """Test listing leads for an internal user."""
    response = await client.get("/v1/leads")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_list_contacts_alias_internal_user(client: AsyncClient):
    """Test /contacts alias for listing."""
    response = await client.get("/v1/contacts")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_list_leads_non_internal_forbidden(other_user_client: AsyncClient):
    """Test listing leads is forbidden for non-internal users."""
    response = await other_user_client.get("/v1/leads")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_leads_unauthorized(client_no_auth: AsyncClient):
    """Test listing leads without auth fails."""
    response = await client_no_auth.get("/v1/leads")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_leads_internal_unverified_forbidden(client_no_auth: AsyncClient):
    """Test listing leads is forbidden for internal-domain users without verified email."""
    import uuid

    from src.api.middleware.auth import get_current_user
    from src.api.models.models import User

    async def override_get_current_user():
        return User(
            id=uuid.uuid4(),
            email="attacker@mutx.dev",
            password_hash="hashedpassword",
            is_active=True,
            is_email_verified=False,
            name="Attacker",
        )

    client_no_auth.app.dependency_overrides[get_current_user] = override_get_current_user
    response = await client_no_auth.get("/v1/leads")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_lead_internal_user(client: AsyncClient, db_session: AsyncSession):
    """Test fetching a single lead when internal/authenticated."""
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

    response = await client.get(f"/v1/leads/{lead.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(lead.id)
    assert data["email"] == "reader@example.com"


@pytest.mark.asyncio
async def test_get_lead_non_internal_forbidden(other_user_client: AsyncClient, db_session: AsyncSession):
    """Test fetching a lead is forbidden for non-internal users."""
    lead = Lead(email="private@example.com", source="homepage")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    response = await other_user_client.get(f"/v1/leads/{lead.id}")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_lead_unauthorized(client_no_auth: AsyncClient, db_session: AsyncSession):
    """Test fetching a single lead without auth fails."""
    lead = Lead(email="private@example.com", source="homepage")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    response = await client_no_auth.get(f"/v1/leads/{lead.id}")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_lead_not_found(client: AsyncClient):
    """Test fetching an unknown lead returns 404."""
    response = await client.get("/v1/leads/00000000-0000-0000-0000-999999999999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_lead_internal_user(client: AsyncClient, db_session: AsyncSession):
    lead = Lead(
        email="update-me@example.com",
        name="Old Name",
        company="Old Co",
        source="docs",
    )
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    response = await client.patch(
        f"/v1/leads/{lead.id}",
        json={
            "name": "New Name",
            "company": "New Co",
            "message": "Interested in enterprise.",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Name"
    assert data["company"] == "New Co"
    assert data["message"] == "Interested in enterprise."


@pytest.mark.asyncio
async def test_update_contact_alias_internal_user(client: AsyncClient, db_session: AsyncSession):
    lead = Lead(
        email="alias-update@example.com",
        name="Alias",
        source="docs",
    )
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    response = await client.patch(
        f"/v1/contacts/{lead.id}",
        json={"source": "partner-referral"},
    )
    assert response.status_code == 200
    assert response.json()["source"] == "partner-referral"


@pytest.mark.asyncio
async def test_update_lead_requires_payload(client: AsyncClient, db_session: AsyncSession):
    lead = Lead(email="empty-update@example.com", source="docs")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    response = await client.patch(f"/v1/leads/{lead.id}", json={})
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_delete_lead_internal_user(client: AsyncClient, db_session: AsyncSession):
    lead = Lead(email="delete-me@example.com", source="docs")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    delete_response = await client.delete(f"/v1/leads/{lead.id}")
    assert delete_response.status_code == 204

    get_response = await client.get(f"/v1/leads/{lead.id}")
    assert get_response.status_code == 404


@pytest.mark.asyncio
async def test_delete_contact_alias_non_internal_forbidden(
    other_user_client: AsyncClient, db_session: AsyncSession
):
    lead = Lead(email="forbidden-delete@example.com", source="docs")
    db_session.add(lead)
    await db_session.commit()
    await db_session.refresh(lead)

    response = await other_user_client.delete(f"/v1/contacts/{lead.id}")
    assert response.status_code == 403
