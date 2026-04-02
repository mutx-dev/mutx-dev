"""
Contract tests for sdk/mutx/leads.py — covers Lead, Leads, and Contacts.
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any

import httpx
import pytest


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_LEAD_PAYLOAD_DEFAULTS: dict[str, Any] = {
    "id": str(uuid.UUID("a1b2c3d4-e5f6-7890-abcd-ef1234567890")),
    "email": "alice@example.com",
    "name": "Alice",
    "company": "Acme Corp",
    "message": "Interested in your product.",
    "source": "website",
    "created_at": "2026-04-01T10:00:00",
}


def _lead_payload(**overrides: Any) -> dict[str, Any]:
    payload = dict(_LEAD_PAYLOAD_DEFAULTS)
    # Always refresh id/created_at so repeated calls don't share state
    payload["id"] = str(uuid.uuid4())
    payload["created_at"] = datetime.now(timezone.utc).isoformat()
    payload.update(overrides)
    return payload


def _leads_response(*items: dict[str, Any]) -> list[dict[str, Any]]:
    return list(items)


# ---------------------------------------------------------------------------
# Lead dataclass tests (no I/O)
# ---------------------------------------------------------------------------

def test_lead_parsing_all_fields() -> None:
    from mutx.leads import Lead

    raw = _lead_payload(name="Bob", company="WidgetCo", source="referral")
    lead = Lead(raw)

    assert lead.id == uuid.UUID(raw["id"])
    assert lead.email == raw["email"]
    assert lead.name == raw["name"]
    assert lead.company == raw["company"]
    assert lead.message == raw["message"]
    assert lead.source == raw["source"]
    assert isinstance(lead.created_at, datetime)
    assert lead._data == raw


def test_lead_parsing_minimal_fields() -> None:
    from mutx.leads import Lead

    raw = {
        "id": str(uuid.uuid4()),
        "email": "min@example.com",
        "created_at": "2026-01-15T08:30:00",
    }
    lead = Lead(raw)

    assert lead.email == "min@example.com"
    assert lead.name is None
    assert lead.company is None
    assert lead.message is None
    assert lead.source is None


def test_lead_repr() -> None:
    from mutx.leads import Lead

    raw = _lead_payload(email="repr@test.com", name="Repr Test")
    lead = Lead(raw)

    r = repr(lead)
    assert "Lead" in r
    assert "repr@test.com" in r
    assert "Repr Test" in r


# ---------------------------------------------------------------------------
# Leads — sync methods
# ---------------------------------------------------------------------------

def test_leads_create_posts_to_v1_leads(client) -> None:  # type: ignore[arg-type]
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(201, json=_lead_payload(email="new@example.com"))

    sync_client = httpx.Client(base_url="http://test", transport=httpx.MockTransport(handler))
    from mutx.leads import Leads

    leads = Leads(sync_client)
    lead = leads.create(email="new@example.com", name="New User", company="Acme")

    assert captured["path"] == "/v1/leads"
    assert captured["json"]["email"] == "new@example.com"
    assert captured["json"]["name"] == "New User"
    assert captured["json"]["company"] == "Acme"
    assert lead.email == "new@example.com"
    sync_client.close()


def test_leads_list_returns_lead_objects(client) -> None:  # type: ignore[arg-type]
    p1 = _lead_payload(email="alice@test.com")
    p2 = _lead_payload(email="bob@test.com")

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=[p1, p2])

    sync_client = httpx.Client(base_url="http://test", transport=httpx.MockTransport(handler))
    from mutx.leads import Leads

    leads = Leads(sync_client)
    result = leads.list(skip=10, limit=25)

    assert len(result) == 2
    assert result[0].email == "alice@test.com"
    assert result[1].email == "bob@test.com"
    sync_client.close()


def test_leads_get_fetches_single_lead(client) -> None:  # type: ignore[arg-type]
    lid = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_lead_payload(id=lid, email="get@test.com"))

    sync_client = httpx.Client(base_url="http://test", transport=httpx.MockTransport(handler))
    from mutx.leads import Leads

    leads = Leads(sync_client)
    lead = leads.get(lid)

    assert lead.email == "get@test.com"
    sync_client.close()


def test_leads_update_sends_patch_with_payload(client) -> None:  # type: ignore[arg-type]
    lid = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_lead_payload(id=lid, name="Updated Name"))

    sync_client = httpx.Client(base_url="http://test", transport=httpx.MockTransport(handler))
    from mutx.leads import Leads

    leads = Leads(sync_client)
    lead = leads.update(lid, name="Updated Name", company="NewCo")

    assert captured["path"] == f"/v1/leads/{lid}"
    assert captured["json"]["name"] == "Updated Name"
    assert captured["json"]["company"] == "NewCo"
    assert lead.name == "Updated Name"
    sync_client.close()


def test_leads_update_omits_none_fields(client) -> None:  # type: ignore[arg-type]
    lid = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_lead_payload(id=lid))

    sync_client = httpx.Client(base_url="http://test", transport=httpx.MockTransport(handler))
    from mutx.leads import Leads

    leads = Leads(sync_client)
    leads.update(lid, name="Only Name")

    # None-valued fields must not appear in the JSON body
    assert "company" not in captured["json"]
    assert captured["json"]["name"] == "Only Name"
    sync_client.close()


def test_leads_delete_sends_delete_request(client) -> None:  # type: ignore[arg-type]
    lid = str(uuid.uuid4())
    delete_called = False

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal delete_called
        if request.method == "DELETE":
            delete_called = True
        return httpx.Response(204)

    sync_client = httpx.Client(base_url="http://test", transport=httpx.MockTransport(handler))
    from mutx.leads import Leads

    leads = Leads(sync_client)
    leads.delete(lid)

    assert delete_called
    sync_client.close()


def test_leads_sync_methods_reject_async_client(client) -> None:  # type: ignore[arg-type]
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=[])

    async with httpx.AsyncClient(
        base_url="http://test", transport=httpx.MockTransport(handler)
    ) as async_client:
        from mutx.leads import Leads

        leads = Leads(async_client)

        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            leads.create(email="test@test.com")

        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            leads.list()

        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            leads.get(uuid.uuid4())

        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            leads.update(uuid.uuid4(), name="x")

        with pytest.raises(RuntimeError, match="sync httpx.Client"):
            leads.delete(uuid.uuid4())


# ---------------------------------------------------------------------------
# Leads — async methods
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_leads_acreate_posts_to_v1_leads() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(201, json=_lead_payload(email="async@test.com"))

    async with httpx.AsyncClient(
        base_url="http://test", transport=httpx.MockTransport(handler)
    ) as client:
        from mutx.leads import Leads

        leads = Leads(client)
        lead = await leads.acreate(email="async@test.com", source="newsletter")

    assert captured["path"] == "/v1/leads"
    assert captured["json"]["email"] == "async@test.com"
    assert captured["json"]["source"] == "newsletter"
    assert lead.email == "async@test.com"


@pytest.mark.asyncio
async def test_leads_alist_returns_lead_objects() -> None:
    p1 = _lead_payload(email="a@test.com")
    p2 = _lead_payload(email="b@test.com")

    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=[p1, p2])

    async with httpx.AsyncClient(
        base_url="http://test", transport=httpx.MockTransport(handler)
    ) as client:
        from mutx.leads import Leads

        leads = Leads(client)
        result = await leads.alist(skip=5, limit=20)

    assert len(result) == 2
    assert result[0].email == "a@test.com"
    assert result[1].email == "b@test.com"


@pytest.mark.asyncio
async def test_leads_aget_fetches_single_lead() -> None:
    lid = str(uuid.uuid4())

    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_lead_payload(id=lid, email="async-get@test.com"))

    async with httpx.AsyncClient(
        base_url="http://test", transport=httpx.MockTransport(handler)
    ) as client:
        from mutx.leads import Leads

        leads = Leads(client)
        lead = await leads.aget(lid)

    assert lead.email == "async-get@test.com"


@pytest.mark.asyncio
async def test_leads_aupdate_sends_patch() -> None:
    lid = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_lead_payload(id=lid, message="updated msg"))

    async with httpx.AsyncClient(
        base_url="http://test", transport=httpx.MockTransport(handler)
    ) as client:
        from mutx.leads import Leads

        leads = Leads(client)
        lead = await leads.aupdate(lid, message="updated msg")

    assert captured["path"] == f"/v1/leads/{lid}"
    assert captured["json"]["message"] == "updated msg"
    assert lead.message == "updated msg"


@pytest.mark.asyncio
async def test_leads_adelete_sends_delete() -> None:
    lid = str(uuid.uuid4())
    delete_called = False

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal delete_called
        if request.method == "DELETE":
            delete_called = True
        return httpx.Response(204)

    async with httpx.AsyncClient(
        base_url="http://test", transport=httpx.MockTransport(handler)
    ) as client:
        from mutx.leads import Leads

        leads = Leads(client)
        await leads.adelete(lid)

    assert delete_called


def test_leads_async_methods_reject_sync_client() -> None:
    """Sync methods must raise when given an httpx.AsyncClient."""
    sync_client = httpx.Client(base_url="http://test")

    from mutx.leads import Leads

    leads = Leads(sync_client)

    with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
        await leads.acreate(email="x@test.com")  # type: ignore[operator]

    with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
        await leads.alist()  # type: ignore[operator]

    with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
        await leads.aget(uuid.uuid4())  # type: ignore[operator]

    with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
        await leads.aupdate(uuid.uuid4(), name="x")  # type: ignore[operator]

    with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
        await leads.adelete(uuid.uuid4())  # type: ignore[operator]

    sync_client.close()


# ---------------------------------------------------------------------------
# Contacts — sync methods (inherits from Leads, routes to /v1/leads/contacts)
# ---------------------------------------------------------------------------

def test_contacts_create_posts_to_v1_leads_contacts(client) -> None:  # type: ignore[arg-type]
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(201, json=_lead_payload(email="contact@example.com"))

    sync_client = httpx.Client(base_url="http://test", transport=httpx.MockTransport(handler))
    from mutx.leads import Contacts

    contacts = Contacts(sync_client)
    contact = contacts.create(email="contact@example.com", company="AcmeCorp")

    assert captured["path"] == "/v1/leads/contacts"
    assert captured["json"]["email"] == "contact@example.com"
    assert captured["json"]["company"] == "AcmeCorp"
    assert contact.email == "contact@example.com"
    sync_client.close()


def test_contacts_list_queries_v1_leads_contacts(client) -> None:  # type: ignore[arg-type]
    p1 = _lead_payload(email="c1@test.com")

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=[p1])

    sync_client = httpx.Client(base_url="http://test", transport=httpx.MockTransport(handler))
    from mutx.leads import Contacts

    contacts = Contacts(sync_client)
    result = contacts.list(skip=0, limit=10)

    assert len(result) == 1
    assert result[0].email == "c1@test.com"
    sync_client.close()


def test_contacts_get(client) -> None:  # type: ignore[arg-type]
    cid = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_lead_payload(id=cid, email="get-contact@test.com"))

    sync_client = httpx.Client(base_url="http://test", transport=httpx.MockTransport(handler))
    from mutx.leads import Contacts

    contacts = Contacts(sync_client)
    contact = contacts.get(cid)

    assert contact.email == "get-contact@test.com"
    sync_client.close()


def test_contacts_update(client) -> None:  # type: ignore[arg-type]
    cid = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_lead_payload(id=cid, name="Updated Contact"))

    sync_client = httpx.Client(base_url="http://test", transport=httpx.MockTransport(handler))
    from mutx.leads import Contacts

    contacts = Contacts(sync_client)
    updated = contacts.update(cid, name="Updated Contact")

    assert captured["path"] == f"/v1/leads/contacts/{cid}"
    assert captured["json"]["name"] == "Updated Contact"
    assert updated.name == "Updated Contact"
    sync_client.close()


def test_contacts_delete(client) -> None:  # type: ignore[arg-type]
    cid = str(uuid.uuid4())
    delete_called = False

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal delete_called
        if request.method == "DELETE":
            delete_called = True
        return httpx.Response(204)

    sync_client = httpx.Client(base_url="http://test", transport=httpx.MockTransport(handler))
    from mutx.leads import Contacts

    contacts = Contacts(sync_client)
    contacts.delete(cid)

    assert delete_called
    sync_client.close()


# ---------------------------------------------------------------------------
# Contacts — async methods
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_contacts_acreate() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(201, json=_lead_payload(email="async-contact@test.com"))

    async with httpx.AsyncClient(
        base_url="http://test", transport=httpx.MockTransport(handler)
    ) as client:
        from mutx.leads import Contacts

        contacts = Contacts(client)
        contact = await contacts.acreate(email="async-contact@test.com")

    assert captured["path"] == "/v1/leads/contacts"
    assert captured["json"]["email"] == "async-contact@test.com"
    assert contact.email == "async-contact@test.com"


@pytest.mark.asyncio
async def test_contacts_alist() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=[_lead_payload(email="al1@test.com")])

    async with httpx.AsyncClient(
        base_url="http://test", transport=httpx.MockTransport(handler)
    ) as client:
        from mutx.leads import Contacts

        contacts = Contacts(client)
        result = await contacts.alist()

    assert len(result) == 1
    assert result[0].email == "al1@test.com"


@pytest.mark.asyncio
async def test_contacts_aget() -> None:
    cid = str(uuid.uuid4())

    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=_lead_payload(id=cid, email="acontact-get@test.com"))

    async with httpx.AsyncClient(
        base_url="http://test", transport=httpx.MockTransport(handler)
    ) as client:
        from mutx.leads import Contacts

        contacts = Contacts(client)
        contact = await contacts.aget(cid)

    assert contact.email == "acontact-get@test.com"


@pytest.mark.asyncio
async def test_contacts_aupdate() -> None:
    cid = str(uuid.uuid4())
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_lead_payload(id=cid, source="campaign"))

    async with httpx.AsyncClient(
        base_url="http://test", transport=httpx.MockTransport(handler)
    ) as client:
        from mutx.leads import Contacts

        contacts = Contacts(client)
        updated = await contacts.aupdate(cid, source="campaign")

    assert captured["path"] == f"/v1/leads/contacts/{cid}"
    assert captured["json"]["source"] == "campaign"
    assert updated.source == "campaign"


@pytest.mark.asyncio
async def test_contacts_adelete() -> None:
    cid = str(uuid.uuid4())
    delete_called = False

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal delete_called
        if request.method == "DELETE":
            delete_called = True
        return httpx.Response(204)

    async with httpx.AsyncClient(
        base_url="http://test", transport=httpx.MockTransport(handler)
    ) as client:
        from mutx.leads import Contacts

        contacts = Contacts(client)
        await contacts.adelete(cid)

    assert delete_called
