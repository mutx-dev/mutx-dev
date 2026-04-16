"""Tests for pico_package_builder — real ZIP package generation and OnboardingState readiness."""

import io
import zipfile

import pytest

from src.api.models.pico_onboarding import OnboardingState
from src.api.services.pico_package_builder import build_onboarding_package


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _extract_zip(zip_bytes: bytes) -> dict[str, str]:
    """Extract a ZIP archive into a {filename: content} dict."""
    buf = io.BytesIO(zip_bytes)
    with zipfile.ZipFile(buf, "r") as zf:
        return {name: zf.read(name).decode("utf-8") for name in zf.namelist()}


# ---------------------------------------------------------------------------
# OnboardingState readiness logic
# ---------------------------------------------------------------------------


class TestOnboardingStateReadiness:
    """Test the model_validator that syncs the ready flag."""

    def test_ready_when_all_required_fields_set(self):
        state = OnboardingState(
            stack="hermes", os="macos", provider="openai", goal="install"
        )
        assert state.ready is True

    def test_not_ready_when_stack_missing(self):
        state = OnboardingState(os="macos", provider="openai", goal="install")
        assert state.ready is False

    def test_not_ready_when_os_missing(self):
        state = OnboardingState(stack="hermes", provider="openai", goal="install")
        assert state.ready is False

    def test_not_ready_when_provider_missing(self):
        state = OnboardingState(stack="hermes", os="macos", goal="install")
        assert state.ready is False

    def test_not_ready_when_goal_missing(self):
        state = OnboardingState(stack="hermes", os="macos", provider="openai")
        assert state.ready is False

    def test_not_ready_when_all_missing(self):
        state = OnboardingState()
        assert state.ready is False

    def test_ready_even_without_optional_fields(self):
        """Optional fields (channels, networking, hardware, skill_level) should not block readiness."""
        state = OnboardingState(
            stack="openclaw", os="linux", provider="anthropic", goal="install"
        )
        assert state.channels == []
        assert state.networking is None
        assert state.hardware is None
        assert state.skill_level is None
        assert state.ready is True

    def test_ready_with_all_optional_fields(self):
        state = OnboardingState(
            stack="hermes",
            os="macos",
            provider="openai",
            goal="install",
            channels=["telegram", "discord"],
            networking="tailscale",
            hardware="laptop",
            skill_level="intermediate",
        )
        assert state.ready is True

    def test_compute_ready_matches_validator(self):
        state = OnboardingState(stack="hermes", os="linux", provider="local", goal="repair")
        assert state.compute_ready() is True
        assert state.ready == state.compute_ready()


# ---------------------------------------------------------------------------
# Hermes stack — full state
# ---------------------------------------------------------------------------


class TestHermesPackage:
    """Hermes stack with full state including channels and tailscale networking."""

    @pytest.fixture()
    def state(self):
        return OnboardingState(
            stack="hermes",
            os="macos",
            provider="openai",
            goal="install",
            channels=["telegram", "discord"],
            networking="tailscale",
        )

    @pytest.fixture()
    def files(self, state):
        zip_bytes, filename = build_onboarding_package(state)
        assert filename == "hermes-setup.zip"
        return _extract_zip(zip_bytes)

    def test_contains_config_yaml(self, files):
        assert "config.yaml" in files
        assert "provider: openai" in files["config.yaml"]

    def test_contains_agents_md(self, files):
        assert "AGENTS.md" in files
        assert "Hermes" in files["AGENTS.md"]

    def test_contains_env_template(self, files):
        assert ".env.template" in files
        assert "OPENAI_API_KEY" in files[".env.template"]

    def test_contains_install_sh(self, files):
        assert "install.sh" in files
        assert len(files["install.sh"]) > 0

    def test_contains_readme(self, files):
        assert "README.md" in files
        readme = files["README.md"]
        assert "Hermes" in readme
        assert "macOS" in readme
        assert "OpenAI" in readme

    def test_contains_channel_configs(self, files):
        assert "channels/telegram.yaml" in files
        assert "channels/discord.yaml" in files
        assert "TELEGRAM_BOT_TOKEN" in files["channels/telegram.yaml"]
        assert "DISCORD_BOT_TOKEN" in files["channels/discord.yaml"]

    def test_contains_tailscale_setup(self, files):
        assert "tailscale-setup.sh" in files
        assert "tailscale" in files["tailscale-setup.sh"]

    def test_env_template_has_channel_tokens(self, files):
        env = files[".env.template"]
        assert "TELEGRAM_BOT_TOKEN" in env
        assert "DISCORD_BOT_TOKEN" in env


# ---------------------------------------------------------------------------
# OpenClaw stack
# ---------------------------------------------------------------------------


class TestOpenClawPackage:
    """OpenClaw stack — linux + anthropic, no tailscale, no channels."""

    @pytest.fixture()
    def state(self):
        return OnboardingState(
            stack="openclaw",
            os="linux",
            provider="anthropic",
            goal="install",
        )

    @pytest.fixture()
    def files(self, state):
        zip_bytes, filename = build_onboarding_package(state)
        assert filename == "openclaw-setup.zip"
        return _extract_zip(zip_bytes)

    def test_contains_openclaw_json(self, files):
        assert "openclaw.json" in files
        import json
        data = json.loads(files["openclaw.json"])
        assert data["provider"] == "anthropic"

    def test_no_tailscale_script(self, files):
        assert "tailscale-setup.sh" not in files

    def test_no_channels_dir(self, files):
        channel_files = [f for f in files if f.startswith("channels/")]
        assert channel_files == []

    def test_env_template_has_anthropic_key(self, files):
        assert ".env.template" in files
        assert "ANTHROPIC_API_KEY" in files[".env.template"]

    def test_readme_mentions_stack_os_provider(self, files):
        readme = files["README.md"]
        assert "OpenClaw" in readme
        assert "Linux" in readme
        assert "Anthropic" in readme

    def test_install_sh_non_empty(self, files):
        assert "install.sh" in files
        assert len(files["install.sh"].strip()) > 0


# ---------------------------------------------------------------------------
# NanoClaw stack
# ---------------------------------------------------------------------------


class TestNanoClawPackage:
    """NanoClaw stack — windows_wsl2 + local provider."""

    @pytest.fixture()
    def state(self):
        return OnboardingState(
            stack="nanoclaw",
            os="windows_wsl2",
            provider="local",
            goal="install",
        )

    @pytest.fixture()
    def files(self, state):
        zip_bytes, filename = build_onboarding_package(state)
        assert filename == "nanoclaw-setup.zip"
        return _extract_zip(zip_bytes)

    def test_contains_docker_compose(self, files):
        assert "docker-compose.yml" in files
        assert "nanoclaw" in files["docker-compose.yml"]

    def test_readme_mentions_stack_os_provider(self, files):
        readme = files["README.md"]
        assert "NanoClaw" in readme
        assert "Windows (WSL2)" in readme
        # Local provider is rendered as "Local (LM Studio/Ollama)"
        assert "Local" in readme

    def test_env_template_has_local_url(self, files):
        assert ".env.template" in files
        assert "LOCAL_MODEL_URL" in files[".env.template"]

    def test_no_tailscale_without_networking(self, files):
        assert "tailscale-setup.sh" not in files


# ---------------------------------------------------------------------------
# PicoClaw stack
# ---------------------------------------------------------------------------


class TestPicoClawPackage:
    """PicoClaw stack — android + google provider."""

    @pytest.fixture()
    def state(self):
        return OnboardingState(
            stack="picoclaw",
            os="android",
            provider="google",
            goal="install",
        )

    @pytest.fixture()
    def files(self, state):
        zip_bytes, filename = build_onboarding_package(state)
        assert filename == "picoclaw-setup.zip"
        return _extract_zip(zip_bytes)

    def test_contains_config_json(self, files):
        assert "config.json" in files
        assert "google" in files["config.json"]

    def test_contains_security_yml_template(self, files):
        assert ".security.yml.template" in files
        assert len(files[".security.yml.template"]) > 0

    def test_readme_mentions_stack_os_provider(self, files):
        readme = files["README.md"]
        assert "PicoClaw" in readme
        assert "Android" in readme
        assert "Google" in readme

    def test_env_template_has_google_key(self, files):
        assert ".env.template" in files
        assert "GOOGLE_API_KEY" in files[".env.template"]


# ---------------------------------------------------------------------------
# Cross-stack validation
# ---------------------------------------------------------------------------


class TestCrossStackValidation:
    """Checks that apply to all stacks."""

    @pytest.mark.parametrize(
        "stack,os_name,provider",
        [
            ("hermes", "macos", "openai"),
            ("openclaw", "linux", "anthropic"),
            ("nanoclaw", "windows_wsl2", "local"),
            ("picoclaw", "android", "google"),
        ],
    )
    def test_install_sh_non_empty(self, stack, os_name, provider):
        state = OnboardingState(
            stack=stack, os=os_name, provider=provider, goal="install"
        )
        zip_bytes, _ = build_onboarding_package(state)
        files = _extract_zip(zip_bytes)
        assert "install.sh" in files
        assert len(files["install.sh"].strip()) > 0

    @pytest.mark.parametrize(
        "stack,os_name,provider",
        [
            ("hermes", "macos", "openai"),
            ("openclaw", "linux", "anthropic"),
            ("nanoclaw", "windows_wsl2", "local"),
            ("picoclaw", "android", "google"),
        ],
    )
    def test_readme_mentions_correct_details(self, stack, os_name, provider):
        state = OnboardingState(
            stack=stack, os=os_name, provider=provider, goal="install"
        )
        zip_bytes, _ = build_onboarding_package(state)
        files = _extract_zip(zip_bytes)
        readme = files["README.md"]

        stack_names = {"hermes": "Hermes", "openclaw": "OpenClaw", "nanoclaw": "NanoClaw", "picoclaw": "PicoClaw"}
        os_names = {"macos": "macOS", "linux": "Linux", "windows_wsl2": "Windows (WSL2)", "android": "Android"}
        provider_names = {"openai": "OpenAI", "anthropic": "Anthropic", "google": "Google", "local": "Local"}

        assert stack_names[stack] in readme
        assert os_names[os_name] in readme
        assert provider_names[provider] in readme

    @pytest.mark.parametrize(
        "stack,os_name,provider,expected_key",
        [
            ("hermes", "macos", "openai", "OPENAI_API_KEY"),
            ("openclaw", "linux", "anthropic", "ANTHROPIC_API_KEY"),
            ("nanoclaw", "windows_wsl2", "local", "LOCAL_MODEL_URL"),
            ("picoclaw", "android", "google", "GOOGLE_API_KEY"),
        ],
    )
    def test_env_template_has_correct_provider_key(self, stack, os_name, provider, expected_key):
        state = OnboardingState(
            stack=stack, os=os_name, provider=provider, goal="install"
        )
        zip_bytes, _ = build_onboarding_package(state)
        files = _extract_zip(zip_bytes)
        assert expected_key in files[".env.template"]

    def test_no_tailscale_when_not_requested(self):
        state = OnboardingState(
            stack="hermes", os="linux", provider="openai", goal="install",
            networking="local",
        )
        zip_bytes, _ = build_onboarding_package(state)
        files = _extract_zip(zip_bytes)
        assert "tailscale-setup.sh" not in files

    def test_no_tailscale_when_networking_is_none(self):
        state = OnboardingState(
            stack="hermes", os="linux", provider="openai", goal="install",
        )
        zip_bytes, _ = build_onboarding_package(state)
        files = _extract_zip(zip_bytes)
        assert "tailscale-setup.sh" not in files

    def test_tailscale_included_when_requested(self):
        state = OnboardingState(
            stack="openclaw", os="linux", provider="openai", goal="install",
            networking="tailscale",
        )
        zip_bytes, _ = build_onboarding_package(state)
        files = _extract_zip(zip_bytes)
        assert "tailscale-setup.sh" in files

    def test_filename_reflects_stack(self):
        for stack in ("hermes", "openclaw", "nanoclaw", "picoclaw"):
            state = OnboardingState(
                stack=stack, os="linux", provider="openai", goal="install"
            )
            _, filename = build_onboarding_package(state)
            assert filename == f"{stack}-setup.zip"
