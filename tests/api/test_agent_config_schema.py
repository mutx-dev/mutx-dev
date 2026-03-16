import json

import pytest
from httpx import AsyncClient
from pydantic import ValidationError

from src.api.models.schemas import (
    AgentConfigUpdateRequest,
    AgentConfigValidateRequest,
    AgentConfigValidateResponse,
    AnthropicAgentConfig,
    CustomAgentConfig,
    LangChainAgentConfig,
    OpenAIAgentConfig,
)


def test_openai_agent_config_validates_typed_fields() -> None:
    config = OpenAIAgentConfig(
        name="Support Agent",
        model="gpt-4o-mini",
        temperature=0.2,
        max_tokens=512,
        system_prompt="You help users.",
    )

    assert config.name == "Support Agent"
    assert config.model == "gpt-4o-mini"
    assert config.temperature == 0.2
    assert config.max_tokens == 512
    assert config.system_prompt == "You help users."
    assert config.version == 1


def test_openai_agent_config_rejects_invalid_temperature() -> None:
    with pytest.raises(ValidationError):
        OpenAIAgentConfig(model="gpt-4o", temperature=5.0)


def test_openai_agent_config_rejects_invalid_max_tokens() -> None:
    with pytest.raises(ValidationError):
        OpenAIAgentConfig(model="gpt-4o", max_tokens=0)


def test_anthropic_agent_config_rejects_temperature_above_limit() -> None:
    with pytest.raises(ValidationError):
        AnthropicAgentConfig(model="claude-3-5-sonnet-20240620", temperature=1.1)


def test_agent_config_update_request_accepts_dict_or_json_string() -> None:
    from_dict = AgentConfigUpdateRequest(config={"model": "gpt-4o", "temperature": 0.1})
    from_json = AgentConfigUpdateRequest(
        config=json.dumps({"model": "gpt-4o-mini", "temperature": 0.3})
    )

    assert from_dict.config["model"] == "gpt-4o"
    assert isinstance(from_json.config, str)


# --- LangChain config typed field validation ---


def test_langchain_agent_config_validates_typed_fields() -> None:
    config = LangChainAgentConfig(
        chain_id="my-chain",
        parameters={"k": 5},
    )
    assert config.chain_id == "my-chain"
    assert config.parameters == {"k": 5}


def test_langchain_agent_config_rejects_empty_chain_id() -> None:
    with pytest.raises(ValidationError):
        LangChainAgentConfig(chain_id="")


def test_langchain_agent_config_rejects_extra_fields() -> None:
    with pytest.raises(ValidationError):
        LangChainAgentConfig(chain_id="my-chain", unknown_field="x")


# --- Custom config typed field validation ---


def test_custom_agent_config_validates_typed_fields() -> None:
    config = CustomAgentConfig(
        image="myrepo/myimage:latest",
        command=["python", "run.py"],
        env={"ENV": "prod"},
    )
    assert config.image == "myrepo/myimage:latest"
    assert config.command == ["python", "run.py"]
    assert config.env == {"ENV": "prod"}


def test_custom_agent_config_rejects_empty_image() -> None:
    with pytest.raises(ValidationError):
        CustomAgentConfig(image="")


def test_custom_agent_config_rejects_extra_fields() -> None:
    with pytest.raises(ValidationError):
        CustomAgentConfig(image="myimage:latest", unknown_field="x")


# --- AgentConfigValidateRequest schema ---


def test_agent_config_validate_request_defaults_to_openai_type() -> None:
    req = AgentConfigValidateRequest(config={"model": "gpt-4o"})
    from src.api.models.models import AgentType

    assert req.type == AgentType.OPENAI


def test_agent_config_validate_request_accepts_dict_and_json_string() -> None:
    from src.api.models.models import AgentType

    req_dict = AgentConfigValidateRequest(type=AgentType.OPENAI, config={"model": "gpt-4o"})
    req_json = AgentConfigValidateRequest(
        type=AgentType.OPENAI, config=json.dumps({"model": "gpt-4o"})
    )
    assert req_dict.config == {"model": "gpt-4o"}
    assert isinstance(req_json.config, str)


# --- POST /v1/agents/validate-config endpoint ---


class TestValidateAgentConfigEndpoint:
    @pytest.mark.asyncio
    async def test_validate_valid_openai_config(self, client: AsyncClient) -> None:
        response = await client.post(
            "/v1/agents/validate-config",
            json={"type": "openai", "config": {"model": "gpt-4o", "temperature": 0.5}},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["type"] == "openai"
        assert data["config"]["model"] == "gpt-4o"
        assert data["config"]["temperature"] == 0.5
        assert data["errors"] == []

    @pytest.mark.asyncio
    async def test_validate_invalid_openai_temperature(self, client: AsyncClient) -> None:
        response = await client.post(
            "/v1/agents/validate-config",
            json={"type": "openai", "config": {"model": "gpt-4o", "temperature": 9.9}},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert data["type"] == "openai"
        assert data["config"] is None
        assert len(data["errors"]) > 0
        assert any("temperature" in err["field"] for err in data["errors"])

    @pytest.mark.asyncio
    async def test_validate_valid_anthropic_config(self, client: AsyncClient) -> None:
        response = await client.post(
            "/v1/agents/validate-config",
            json={
                "type": "anthropic",
                "config": {"model": "claude-3-5-sonnet-20240620", "temperature": 0.8},
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["type"] == "anthropic"

    @pytest.mark.asyncio
    async def test_validate_invalid_anthropic_temperature(self, client: AsyncClient) -> None:
        response = await client.post(
            "/v1/agents/validate-config",
            json={
                "type": "anthropic",
                "config": {"model": "claude-3-5-sonnet-20240620", "temperature": 1.5},
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        errors = data["errors"]
        assert any("temperature" in err["field"] for err in errors)

    @pytest.mark.asyncio
    async def test_validate_valid_langchain_config(self, client: AsyncClient) -> None:
        response = await client.post(
            "/v1/agents/validate-config",
            json={"type": "langchain", "config": {"chain_id": "my-chain", "parameters": {}}},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["config"]["chain_id"] == "my-chain"

    @pytest.mark.asyncio
    async def test_validate_langchain_config_missing_chain_id(self, client: AsyncClient) -> None:
        response = await client.post(
            "/v1/agents/validate-config",
            json={"type": "langchain", "config": {"parameters": {}}},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert any("chain_id" in err["field"] for err in data["errors"])

    @pytest.mark.asyncio
    async def test_validate_valid_custom_config(self, client: AsyncClient) -> None:
        response = await client.post(
            "/v1/agents/validate-config",
            json={
                "type": "custom",
                "config": {
                    "image": "myrepo/myimage:latest",
                    "command": ["python", "run.py"],
                    "env": {"ENV": "prod"},
                },
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["config"]["image"] == "myrepo/myimage:latest"

    @pytest.mark.asyncio
    async def test_validate_custom_config_missing_image(self, client: AsyncClient) -> None:
        response = await client.post(
            "/v1/agents/validate-config",
            json={"type": "custom", "config": {"command": ["run.sh"]}},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False
        assert any("image" in err["field"] for err in data["errors"])

    @pytest.mark.asyncio
    async def test_validate_config_accepts_json_string(self, client: AsyncClient) -> None:
        config_str = json.dumps({"model": "gpt-4o-mini", "temperature": 0.3})
        response = await client.post(
            "/v1/agents/validate-config",
            json={"type": "openai", "config": config_str},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert data["config"]["model"] == "gpt-4o-mini"

    @pytest.mark.asyncio
    async def test_validate_config_extra_fields_rejected(self, client: AsyncClient) -> None:
        response = await client.post(
            "/v1/agents/validate-config",
            json={"type": "openai", "config": {"model": "gpt-4o", "unknown_key": "value"}},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False

    @pytest.mark.asyncio
    async def test_validate_config_requires_authentication(
        self, client_no_auth: AsyncClient
    ) -> None:
        response = await client_no_auth.post(
            "/v1/agents/validate-config",
            json={"type": "openai", "config": {"model": "gpt-4o"}},
        )
        assert response.status_code == 401

