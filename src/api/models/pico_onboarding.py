from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

# ── Literal type aliases ──────────────────────────────────────────────

PicoStack = Literal["hermes", "openclaw", "nanoclaw", "picoclaw"]
PicoOS = Literal["macos", "linux", "windows_wsl2", "android"]
PicoProvider = Literal["openai", "anthropic", "google", "local"]
PicoHardware = Literal["laptop", "vps", "mini_pc", "edge"]
PicoChannel = Literal["telegram", "discord", "slack", "whatsapp"]
PicoNetworking = Literal["local", "tailscale", "ssh_tunnel", "public"]
PicoSkillLevel = Literal["beginner", "intermediate", "advanced"]
PicoGoal = Literal["install", "repair", "migrate", "compare"]
PicoMessageRole = Literal["user", "assistant"]


# ── Onboarding state ──────────────────────────────────────────────────


class OnboardingState(BaseModel):
    """Structured state extracted from the onboarding conversation."""

    model_config = ConfigDict(extra="allow")

    stack: PicoStack | None = None
    os: PicoOS | None = None
    provider: PicoProvider | None = None
    hardware: PicoHardware | None = None
    channels: list[PicoChannel] = Field(default_factory=list)
    networking: PicoNetworking | None = None
    skill_level: PicoSkillLevel | None = None
    goal: PicoGoal | None = None
    ready: bool = False

    def compute_ready(self) -> bool:
        """Return True when stack, os, provider, and goal are all non-null."""
        return all(
            getattr(self, field) is not None for field in ("stack", "os", "provider", "goal")
        )

    @model_validator(mode="after")
    def _sync_ready(self) -> "OnboardingState":
        self.ready = self.compute_ready()
        return self


# ── Chat endpoints ────────────────────────────────────────────────────


class PicoChatRequest(BaseModel):
    """User message sent to the onboarding coach."""

    model_config = ConfigDict(extra="forbid")

    message: str = Field(..., min_length=1, max_length=6000)
    session_id: str | None = None


class PicoChatResponse(BaseModel):
    """Coach reply with optional onboarding state snapshot."""

    model_config = ConfigDict(extra="allow")

    reply: str
    session_id: str = ""
    onboarding_state: OnboardingState | None = None
    ready_for_package: bool = False


# ── Package generation ────────────────────────────────────────────────


class GeneratePackageRequest(BaseModel):
    """Trigger generation of a ready-to-deploy package for the session."""

    model_config = ConfigDict(extra="forbid")

    session_id: str


class GeneratePackageResponse(BaseModel):
    """Result of package generation with summary and next steps."""

    model_config = ConfigDict(extra="allow")

    filename: str
    package_summary: dict[str, Any]
    next_steps: list[str] = Field(default_factory=list)


# ── Conversation history ──────────────────────────────────────────────


class CoachMessage(BaseModel):
    """A single message in the onboarding conversation history."""

    model_config = ConfigDict(extra="allow")

    role: PicoMessageRole
    content: str
    onboarding_state: OnboardingState | None = None
