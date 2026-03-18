from __future__ import annotations

import sys
import uuid
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "sdk"))

from mutx.leads import Lead, Leads


def _lead_payload(**overrides):
    payload = {
        "id": str(uuid.uuid4()),
        "email": "lead@example.com",
        "name": "Lead",
        "company": "Acme",
        "message": "hello",
        "source": "contact-form",
        "created_at": "2026-03-12T09:00:00",
    }
    payload.update(overrides)
    return payload


def test_lead_parses_z_suffix_timestamps() -> None:
    lead = Lead(_lead_payload(created_at="2026-03-12T09:00:00Z"))

    assert lead.created_at.tzinfo is not None


def test_leads_list_parses_z_suffix_timestamps() -> None:
    client = httpx.Client(
        base_url="https://api.test",
        transport=httpx.MockTransport(
            lambda request: httpx.Response(200, json=[_lead_payload(created_at="2026-03-12T09:00:00Z")])
        ),
    )

    leads = Leads(client).list()

    assert len(leads) == 1
    assert leads[0].created_at.tzinfo is not None
