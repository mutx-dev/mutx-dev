"""
SDK contract tests for leads module.
Tests verify that the SDK correctly maps to the backend API contract.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime
from typing import Any

import httpx
import pytest

from mutx.leads import Lead, Leads, Contacts


def _lead_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "id": str(uuid.uuid4()),
        "email": "test@example.com",
        "name": "Test Lead",
        "company": "Test Corp",
        "message": "Hello world",
        "source": "web",
        "created_at": "2026-03-12T09:00:00",
    }
    payload.update(overrides)
    return payload


# ---------------------------------------------------------------------------
# Leads – create
# ---------------------------------------------------------------------------


def test_leads_create_hits_contract_route_and_maps_payload() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(201, json=_lead_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    leads = Leads(client)

    leads.create(
        email="alice@example.com",
        name="Alice",
        company="Acme",
        message="Interested in pro",
        source="newsletter",
    )

    assert captured["path"] == "/v1/leads"
    assert captured["method"] == "POST"
    assert captured["json"]["email"] == "alice@example.com"
    assert captured["json"]["name"] == "Alice"
    assert captured["json"]["company"] == "Acme"
    assert captured["json"]["message"] == "Interested in pro"
    assert captured["json"]["source"] == "newsletter"


def test_leads_create_only_includes_provided_fields() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(201, json=_lead_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    leads = Leads(client)

    leads.create(email="bob@example.com")

    # Optional fields should be None and excluded from JSON payload
    assert captured["json"]["email"] == "bob@example.com"
    assert captured["json"].get("name") is None
    assert captured["json"].get("company") is None


def test_leads_acreate_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(201, json=_lead_payload())

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    leads = Leads(client)

    import asyncio

    asyncio.run(leads.acreate(email="carol@example.com"))

    assert captured["path"] == "/v1/leads"
    assert captured["method"] == "POST"
    assert captured["json"]["email"] == "carol@example.com"


# ---------------------------------------------------------------------------
# Leads – list
# ---------------------------------------------------------------------------


def test_leads_list_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=[_lead_payload(), _lead_payload()])

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    leads = Leads(client)

    leads.list(skip=10, limit=25)

    assert captured["path"] == "/v1/leads"
    assert captured["method"] == "GET"
    assert captured["params"]["skip"] == "10"
    assert captured["params"]["limit"] == "25"


def test_leads_list_defaults() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["params"] = dict(request.url.params)
        return httpx.Response(200, json=[])

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    leads = Leads(client)

    leads.list()

    assert captured["params"]["skip"] == "0"
    assert captured["params"]["limit"] == "50"


def test_leads_alist_hits_contract_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=[_lead_payload()])

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    leads = Leads(client)

    import asyncio

    asyncio.run(leads.alist())

    assert captured["path"] == "/v1/leads"
    assert captured["method"] == "GET"


# ---------------------------------------------------------------------------
# Leads – get
# ---------------------------------------------------------------------------


def test_leads_get_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    lead_id = uuid.uuid4()

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=_lead_payload(id=str(lead_id)))

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    leads = Leads(client)

    leads.get(lead_id)

    assert captured["path"] == f"/v1/leads/{lead_id}"
    assert captured["method"] == "GET"


def test_leads_get_accepts_string_id() -> None:
    captured: dict[str, Any] = {}
    lead_id = str(uuid.uuid4())

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        return httpx.Response(200, json=_lead_payload(id=lead_id))

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    leads = Leads(client)

    leads.get(lead_id)

    assert captured["path"] == f"/v1/leads/{lead_id}"


def test_leads_aget_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    lead_id = uuid.uuid4()

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=_lead_payload(id=str(lead_id)))

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    leads = Leads(client)

    import asyncio

    asyncio.run(leads.aget(lead_id))

    assert captured["path"] == f"/v1/leads/{lead_id}"
    assert captured["method"] == "GET"


# ---------------------------------------------------------------------------
# Leads – update
# ---------------------------------------------------------------------------


def test_leads_update_hits_contract_route_and_maps_payload() -> None:
    captured: dict[str, Any] = {}
    lead_id = uuid.uuid4()

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_lead_payload(id=str(lead_id), name="Updated"))

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    leads = Leads(client)

    leads.update(lead_id, name="Updated", company="NewCorp")

    assert captured["path"] == f"/v1/leads/{lead_id}"
    assert captured["method"] == "PATCH"
    assert captured["json"]["name"] == "Updated"
    assert captured["json"]["company"] == "NewCorp"
    assert "email" not in captured["json"]


def test_leads_update_only_includes_provided_fields() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_lead_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    leads = Leads(client)

    leads.update(uuid.uuid4(), source="referral")

    assert captured["json"] == {"source": "referral"}


def test_leads_aupdate_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    lead_id = uuid.uuid4()

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_lead_payload(id=str(lead_id)))

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    leads = Leads(client)

    import asyncio

    asyncio.run(leads.aupdate(lead_id, message="new message"))

    assert captured["path"] == f"/v1/leads/{lead_id}"
    assert captured["method"] == "PATCH"
    assert captured["json"]["message"] == "new message"


# ---------------------------------------------------------------------------
# Leads – delete
# ---------------------------------------------------------------------------


def test_leads_delete_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    lead_id = uuid.uuid4()

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(204)

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    leads = Leads(client)

    leads.delete(lead_id)

    assert captured["path"] == f"/v1/leads/{lead_id}"
    assert captured["method"] == "DELETE"


def test_leads_adelete_hits_contract_route() -> None:
    captured: dict[str, Any] = {}
    lead_id = uuid.uuid4()

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(204)

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    leads = Leads(client)

    import asyncio

    asyncio.run(leads.adelete(lead_id))

    assert captured["path"] == f"/v1/leads/{lead_id}"
    assert captured["method"] == "DELETE"


# ---------------------------------------------------------------------------
# Client type enforcement
# ---------------------------------------------------------------------------


def test_leads_list_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    leads = Leads(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        leads.list()


def test_leads_create_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    leads = Leads(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        leads.create(email="test@example.com")


def test_leads_get_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    leads = Leads(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        leads.get(uuid.uuid4())


def test_leads_update_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    leads = Leads(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        leads.update(uuid.uuid4(), name="x")


def test_leads_delete_rejects_async_client() -> None:
    client = httpx.AsyncClient(base_url="https://api.test")
    leads = Leads(client)

    with pytest.raises(RuntimeError, match="requires a sync httpx.Client"):
        leads.delete(uuid.uuid4())


def test_leads_alist_rejects_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    leads = Leads(client)

    import asyncio

    with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
        asyncio.run(leads.alist())


def test_leads_acreate_rejects_sync_client() -> None:
    client = httpx.Client(base_url="https://api.test")
    leads = Leads(client)

    import asyncio

    with pytest.raises(RuntimeError, match="async httpx.AsyncClient"):
        asyncio.run(leads.acreate(email="test@example.com"))


# ---------------------------------------------------------------------------
# Lead model parsing
# ---------------------------------------------------------------------------


def test_lead_parses_required_fields() -> None:
    lead = Lead(_lead_payload())

    assert isinstance(lead.id, uuid.UUID)
    assert lead.email == "test@example.com"
    assert lead.name == "Test Lead"
    assert lead.company == "Test Corp"
    assert lead.message == "Hello world"
    assert lead.source == "web"
    assert isinstance(lead.created_at, datetime)


def test_lead_parses_optional_fields_as_none() -> None:
    payload = _lead_payload()
    payload.pop("name", None)
    payload.pop("company", None)
    payload.pop("message", None)
    payload.pop("source", None)

    lead = Lead(payload)

    assert lead.name is None
    assert lead.company is None
    assert lead.message is None
    assert lead.source is None


def test_lead_repr() -> None:
    lead = Lead(_lead_payload())
    assert "Lead(id=" in repr(lead)
    assert "test@example.com" in repr(lead)


# ---------------------------------------------------------------------------
# Contacts (extends Leads) – contract route verification
# ---------------------------------------------------------------------------


def test_contacts_create_hits_contacts_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(201, json=_lead_payload())

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    contacts = Contacts(client)

    contacts.create(email="contact@example.com")

    assert captured["path"] == "/v1/leads/contacts"
    assert captured["method"] == "POST"


def test_contacts_list_hits_contacts_route() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=[_lead_payload()])

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    contacts = Contacts(client)

    contacts.list()

    assert captured["path"] == "/v1/leads/contacts"
    assert captured["method"] == "GET"


def test_contacts_get_hits_contacts_route() -> None:
    captured: dict[str, Any] = {}
    contact_id = uuid.uuid4()

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=_lead_payload(id=str(contact_id)))

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    contacts = Contacts(client)

    contacts.get(contact_id)

    assert captured["path"] == f"/v1/leads/contacts/{contact_id}"
    assert captured["method"] == "GET"


def test_contacts_update_hits_contacts_route() -> None:
    captured: dict[str, Any] = {}
    contact_id = uuid.uuid4()

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(200, json=_lead_payload(id=str(contact_id)))

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    contacts = Contacts(client)

    contacts.update(contact_id, name="Updated Contact")

    assert captured["path"] == f"/v1/leads/contacts/{contact_id}"
    assert captured["method"] == "PATCH"
    assert captured["json"]["name"] == "Updated Contact"


def test_contacts_delete_hits_contacts_route() -> None:
    captured: dict[str, Any] = {}
    contact_id = uuid.uuid4()

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(204)

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    contacts = Contacts(client)

    contacts.delete(contact_id)

    assert captured["path"] == f"/v1/leads/contacts/{contact_id}"
    assert captured["method"] == "DELETE"


def test_contacts_acreate_hits_contacts_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(201, json=_lead_payload())

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    contacts = Contacts(client)

    import asyncio

    asyncio.run(contacts.acreate(email="async-contact@example.com"))

    assert captured["path"] == "/v1/leads/contacts"
    assert captured["method"] == "POST"


def test_contacts_alist_hits_contacts_route() -> None:
    captured: dict[str, Any] = {}

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=[_lead_payload()])

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    contacts = Contacts(client)

    import asyncio

    asyncio.run(contacts.alist())

    assert captured["path"] == "/v1/leads/contacts"
    assert captured["method"] == "GET"


def test_contacts_aget_hits_contacts_route() -> None:
    captured: dict[str, Any] = {}
    contact_id = uuid.uuid4()

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=_lead_payload(id=str(contact_id)))

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    contacts = Contacts(client)

    import asyncio

    asyncio.run(contacts.aget(contact_id))

    assert captured["path"] == f"/v1/leads/contacts/{contact_id}"
    assert captured["method"] == "GET"


def test_contacts_aupdate_hits_contacts_route() -> None:
    captured: dict[str, Any] = {}
    contact_id = uuid.uuid4()

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(200, json=_lead_payload(id=str(contact_id)))

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    contacts = Contacts(client)

    import asyncio

    asyncio.run(contacts.aupdate(contact_id, message="async update"))

    assert captured["path"] == f"/v1/leads/contacts/{contact_id}"
    assert captured["method"] == "PATCH"


def test_contacts_adelete_hits_contacts_route() -> None:
    captured: dict[str, Any] = {}
    contact_id = uuid.uuid4()

    async def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["method"] = request.method
        return httpx.Response(204)

    client = httpx.AsyncClient(base_url="https://api.test", transport=httpx.MockTransport(handler))
    contacts = Contacts(client)

    import asyncio

    asyncio.run(contacts.adelete(contact_id))

    assert captured["path"] == f"/v1/leads/contacts/{contact_id}"
    assert captured["method"] == "DELETE"
