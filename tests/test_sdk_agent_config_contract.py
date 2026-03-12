from __future__ import annotations

import json
import sys
import uuid
from pathlib import Path
from typing import Any

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "sdk"))

from mutx import Deployments, Webhooks
from mutx.agents import Agent, Agents


def _agent_payload(config: Any = None, **overrides: Any) -> dict[str, Any]:
    payload = {
        "id": str(uuid.uuid4()),
        "name": "test-agent",
        "description": "sdk contract test",
        "status": "creating",
        "config": json.dumps(config if config is not None else {"model": "gpt-4o"}),
        "created_at": "2026-03-12T09:00:00",
        "updated_at": "2026-03-12T09:00:00",
        "user_id": str(uuid.uuid4()),
    }
    payload.update(overrides)
    return payload


def test_agent_parses_stringified_config_into_config_json_and_dict_alias() -> None:
    raw_config = {"model": "gpt-4o-mini", "temperature": 0.2}

    agent = Agent(_agent_payload(config=raw_config))

    assert agent.config == raw_config
    assert agent.config_json == json.dumps(raw_config)
    assert agent._data["config"] == agent.config_json


def test_agents_create_accepts_dict_config_and_sends_backend_json_string_contract() -> None:
    captured: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["path"] = request.url.path
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(201, json=_agent_payload(config={"model": "gpt-4o"}))

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    agents = Agents(client)

    agents.create(
        name="demo",
        description="test",
        config={"model": "gpt-4o", "temperature": 0.1},
    )

    assert captured["path"] == "/agents"
    assert isinstance(captured["json"]["config"], dict)
    assert captured["json"]["config"]["model"] == "gpt-4o"


def test_agents_create_accepts_json_string_config_and_preserves_it() -> None:
    captured: dict[str, Any] = {}
    raw_json = json.dumps({"model": "gpt-4o-mini", "temperature": 0.3})

    def handler(request: httpx.Request) -> httpx.Response:
        captured["json"] = json.loads(request.content.decode())
        return httpx.Response(201, json=_agent_payload(config=json.loads(raw_json)))

    client = httpx.Client(base_url="https://api.test", transport=httpx.MockTransport(handler))
    agents = Agents(client)

    agents.create(name="demo", config=raw_json)

    assert captured["json"]["config"] == raw_json


def test_top_level_sdk_exports_include_deployments_and_webhooks() -> None:
    assert Deployments is not None
    assert Webhooks is not None
