# Contract tests for sdk/mutx/leads.py
from __future__ import annotations

import pytest
from datetime import datetime
from uuid import uuid4
from unittest.mock import Mock, AsyncMock
import httpx

from mutx.leads import Lead, Leads, Contacts


# ── Lead data class ──────────────────────────────────────────────────────────

class TestLead:
    def _sample(self, **overrides):
        d = {
            "id": str(uuid4()),
            "email": "alice@example.com",
            "name": "Alice",
            "company": "ACME",
            "message": "Hi",
            "source": "web",
            "created_at": datetime.now().isoformat(),
        }
        d.update(overrides)
        return d

    def test_required_fields(self):
        d = self._sample()
        lead = Lead(d)
        assert lead.email == "alice@example.com"
        assert lead.name == "Alice"
        assert lead.company == "ACME"
        assert lead.message == "Hi"
        assert lead.source == "web"
        assert str(lead.id) == d["id"]
        assert lead.created_at.year == datetime.now().year

    def test_optional_fields_missing(self):
        d = self._sample(name=None, company=None, message=None, source=None)
        lead = Lead(d)
        assert lead.name is None
        assert lead.company is None
        assert lead.message is None
        assert lead.source is None

    def test_repr(self):
        d = self._sample(name="Bob")
        lead = Lead(d)
        assert "Lead(" in repr(lead)
        assert "Bob" in repr(lead)

    def test_created_at_parses_iso_format(self):
        d = self._sample(created_at="2024-01-15T10:30:00+00:00")
        lead = Lead(d)
        assert lead.created_at.year == 2024
        assert lead.created_at.month == 1

    def test_id_uuid_parsed(self):
        uid = uuid4()
        d = self._sample(id=str(uid))
        lead = Lead(d)
        assert lead.id == uid

    def test_data_preserved(self):
        d = self._sample()
        lead = Lead(d)
        assert lead._data == d


# ── Leads client type guards ─────────────────────────────────────────────────

class TestLeadsClientGuards:
    # Guard checks isinstance(client, httpx.AsyncClient):
    # - True  → sync method raises RuntimeError (client is async)
    # - False → async method raises RuntimeError (client is sync)
    def _async_client(self):
        return Mock(spec=httpx.AsyncClient)

    def _sync_client(self):
        return Mock(spec=httpx.Client)

    def test_create_sync_rejects_async_client(self):
        # Sync method called with AsyncClient → guard raises
        client = self._async_client()
        leads = Leads(client)
        with pytest.raises(RuntimeError, match="sync"):
            leads.create("a@b.com")

    @pytest.mark.asyncio
    async def test_create_async_rejects_sync_client(self):
        # Async method called with sync Client → guard raises
        client = self._sync_client()
        leads = Leads(client)
        with pytest.raises(RuntimeError, match="async"):
            await leads.acreate("a@b.com")


class TestLeadsSyncMethods:
    def _client(self, status=200, json_data=None):
        m = Mock(spec=httpx.Client)
        resp = Mock(spec=httpx.Response)
        resp.status_code = status
        if json_data is not None:
            resp.json.return_value = json_data
        m.post.return_value = resp
        m.get.return_value = resp
        m.patch.return_value = resp
        m.delete.return_value = resp
        return m

    def test_create_returns_lead(self):
        client = self._client(json_data={
            "id": str(uuid4()), "email": "bob@example.com",
            "name": "Bob", "company": None, "message": None,
            "source": None, "created_at": datetime.now().isoformat(),
        })
        lead = Leads(client).create("bob@example.com", name="Bob")
        assert lead.email == "bob@example.com"
        assert client.post.called

    def test_create_posts_to_v1_leads(self):
        client = self._client(json_data={
            "id": str(uuid4()), "email": "c@b.com",
            "name": None, "company": None, "message": None,
            "source": None, "created_at": datetime.now().isoformat(),
        })
        Leads(client).create("c@b.com", name="Carol", company="Corp")
        call_args = client.post.call_args
        assert "/v1/leads" in call_args.args[0]

    def test_list_returns_lead_list(self):
        client = self._client(json_data=[{
            "id": str(uuid4()), "email": "d@b.com",
            "name": None, "company": None, "message": None,
            "source": None, "created_at": datetime.now().isoformat(),
        }])
        leads = Leads(client).list(skip=10, limit=25)
        assert len(leads) == 1
        assert leads[0].email == "d@b.com"

    def test_list_passes_params(self):
        client = self._client(json_data=[])
        Leads(client).list(skip=5, limit=20)
        assert client.get.call_args.kwargs["params"] == {"skip": 5, "limit": 20}

    def test_get_returns_lead(self):
        uid = uuid4()
        client = self._client(json_data={
            "id": str(uid), "email": "e@b.com",
            "name": None, "company": None, "message": None,
            "source": None, "created_at": datetime.now().isoformat(),
        })
        lead = Leads(client).get(uid)
        assert lead.email == "e@b.com"

    def test_get_calls_correct_path(self):
        uid = uuid4()
        client = self._client(json_data={
            "id": str(uid), "email": "f@b.com",
            "name": None, "company": None, "message": None,
            "source": None, "created_at": datetime.now().isoformat(),
        })
        Leads(client).get(uid)
        assert f"/v1/leads/{uid}" in client.get.call_args.args[0]

    def test_update_returns_lead(self):
        uid = uuid4()
        client = self._client(json_data={
            "id": str(uid), "email": "g@b.com",
            "name": "Updated", "company": None, "message": None,
            "source": None, "created_at": datetime.now().isoformat(),
        })
        lead = Leads(client).update(uid, name="Updated")
        assert lead.name == "Updated"

    def test_update_sends_patch(self):
        uid = uuid4()
        client = self._client(json_data={
            "id": str(uid), "email": "h@b.com",
            "name": "Patched", "company": None, "message": None,
            "source": None, "created_at": datetime.now().isoformat(),
        })
        Leads(client).update(uid, message="Hello")
        assert client.patch.called

    def test_delete_calls_delete(self):
        uid = uuid4()
        client = self._client()
        Leads(client).delete(uid)
        assert client.delete.called

    def test_delete_raises_for_status_on_error(self):
        uid = uuid4()
        client = self._client(status=404)
        client.delete.return_value.raise_for_status.side_effect = httpx.HTTPStatusError(
            "Not found", request=Mock(), response=client.delete.return_value
        )
        with pytest.raises(httpx.HTTPStatusError):
            Leads(client).delete(uid)


class TestLeadsAsyncMethods:
    def _async_client(self, status=200, json_data=None):
        m = AsyncMock(spec=httpx.AsyncClient)
        resp = Mock(spec=httpx.Response)
        resp.status_code = status
        if json_data is not None:
            resp.json.return_value = json_data
        m.post.return_value = resp
        m.get.return_value = resp
        m.patch.return_value = resp
        m.delete.return_value = resp
        return m

    @pytest.mark.asyncio
    async def test_acreate_returns_lead(self):
        client = self._async_client(json_data={
            "id": str(uuid4()), "email": "async@b.com",
            "name": None, "company": None, "message": None,
            "source": None, "created_at": datetime.now().isoformat(),
        })
        lead = await Leads(client).acreate("async@b.com")
        assert lead.email == "async@b.com"
        assert client.post.called

    @pytest.mark.asyncio
    async def test_alist_returns_list(self):
        client = self._async_client(json_data=[{
            "id": str(uuid4()), "email": "list@b.com",
            "name": None, "company": None, "message": None,
            "source": None, "created_at": datetime.now().isoformat(),
        }])
        leads = await Leads(client).alist()
        assert len(leads) == 1

    @pytest.mark.asyncio
    async def test_aget_returns_lead(self):
        uid = uuid4()
        client = self._async_client(json_data={
            "id": str(uid), "email": "aget@b.com",
            "name": None, "company": None, "message": None,
            "source": None, "created_at": datetime.now().isoformat(),
        })
        lead = await Leads(client).aget(uid)
        assert lead.email == "aget@b.com"

    @pytest.mark.asyncio
    async def test_adelete_calls_delete(self):
        uid = uuid4()
        client = self._async_client()
        await Leads(client).adelete(uid)
        assert client.delete.called


# ── Contacts alias ──────────────────────────────────────────────────────────

class TestContacts:
    def _client(self, json_data=None):
        m = Mock(spec=httpx.Client)
        resp = Mock(spec=httpx.Response)
        resp.status_code = 200
        if json_data is not None:
            resp.json.return_value = json_data
        m.post.return_value = resp
        m.get.return_value = resp
        m.patch.return_value = resp
        m.delete.return_value = resp
        return m

    def test_contacts_inherits_from_leads(self):
        assert issubclass(Contacts, Leads)

    def test_create_posts_to_v1_contacts(self):
        client = self._client(json_data={
            "id": str(uuid4()), "email": "c@b.com",
            "name": None, "company": None, "message": None,
            "source": None, "created_at": datetime.now().isoformat(),
        })
        Contacts(client).create("c@b.com")
        assert "/v1/contacts" in client.post.call_args.args[0]

    def test_list_posts_to_v1_contacts(self):
        client = self._client(json_data=[])
        Contacts(client).list()
        assert "/v1/contacts" in client.get.call_args.args[0]
