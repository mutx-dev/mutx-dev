from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

PicoTutorConfidence = Literal["high", "medium", "low"]
PicoTutorIntent = Literal[
    "choose",
    "install",
    "repair",
    "migrate",
    "compare",
    "tailscale",
    "optimize",
    "integrate",
]
PicoTutorSkillLevel = Literal["beginner", "intermediate", "advanced"]
PicoTutorSourceKind = Literal["lesson", "knowledge_pack", "official"]
PicoTutorOpenAIConnectionStatusValue = Literal["connected", "platform", "disconnected", "error"]
PicoTutorOpenAIConnectionSource = Literal["user", "platform", "none"]


class PicoTutorSetupContext(BaseModel):
    model_config = ConfigDict(extra="allow")

    onboarding: dict[str, Any] | None = None
    runtime: dict[str, Any] | None = None
    currentSurface: str | None = None


class PicoTutorRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    question: str = Field(..., min_length=1, max_length=6000)
    lessonSlug: str | None = Field(default=None, max_length=255)
    progress: dict[str, Any] | None = None
    setupContext: PicoTutorSetupContext | None = None

    @model_validator(mode="before")
    @classmethod
    def _accept_legacy_payload(cls, value: Any) -> Any:
        if not isinstance(value, dict):
            return value

        normalized = dict(value)
        if "question" not in normalized and "message" in normalized:
            normalized["question"] = normalized["message"]
        if "lessonSlug" not in normalized and "lesson" in normalized:
            normalized["lessonSlug"] = normalized["lesson"]
        return normalized


class PicoTutorOpenAIConnectionRequest(BaseModel):
    apiKey: str = Field(..., min_length=10, max_length=512)


class PicoTutorLessonLink(BaseModel):
    id: str
    title: str
    href: str


class PicoTutorDocLink(BaseModel):
    label: str
    href: str
    sourcePath: str


class PicoTutorCommand(BaseModel):
    label: str
    code: str
    language: str = "bash"
    note: str | None = None


class PicoTutorSource(BaseModel):
    kind: PicoTutorSourceKind
    title: str
    sourcePath: str
    href: str | None = None
    excerpt: str | None = None


class PicoTutorStructuredReply(BaseModel):
    situation: str
    diagnosis: str
    steps: list[str] = Field(default_factory=list)
    commands: list[PicoTutorCommand] = Field(default_factory=list)
    verify: list[str] = Field(default_factory=list)
    ifThisFails: list[str] = Field(default_factory=list)
    officialLinks: list[PicoTutorDocLink] = Field(default_factory=list)
    sources: list[PicoTutorSource] = Field(default_factory=list)
    nextQuestion: str | None = None


class PicoTutorResponse(BaseModel):
    title: str
    summary: str
    answer: str
    confidence: PicoTutorConfidence
    nextActions: list[str] = Field(default_factory=list)
    lessons: list[PicoTutorLessonLink] = Field(default_factory=list)
    docs: list[PicoTutorDocLink] = Field(default_factory=list)
    recommendedLessonIds: list[str] = Field(default_factory=list)
    escalate: bool = False
    escalationReason: str | None = None
    structured: PicoTutorStructuredReply
    intent: PicoTutorIntent
    skillLevel: PicoTutorSkillLevel
    usedOfficialFallback: bool = False
    reply: str | None = None
    nextLesson: str | None = None

    @model_validator(mode="after")
    def _sync_legacy_response_fields(self) -> "PicoTutorResponse":
        if self.reply is None:
            self.reply = self.answer
        if self.nextLesson is None and self.recommendedLessonIds:
            self.nextLesson = self.recommendedLessonIds[0]
        return self


class PicoTutorOpenAIConnectionStatus(BaseModel):
    provider: str = "openai"
    status: PicoTutorOpenAIConnectionStatusValue
    source: PicoTutorOpenAIConnectionSource
    connected: bool
    model: str
    maskedKey: str | None = None
    connectedAt: str | None = None
    validatedAt: str | None = None
    message: str
    apiKeySet: bool | None = None

    @model_validator(mode="after")
    def _sync_legacy_status_fields(self) -> "PicoTutorOpenAIConnectionStatus":
        if self.apiKeySet is None:
            self.apiKeySet = self.source == "user" and self.connected
        return self
