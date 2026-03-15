import json

import pytest
from pydantic import ValidationError

from src.api.models.schemas import AgentConfigUpdateRequest, AnthropicAgentConfig, OpenAIAgentConfig


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
