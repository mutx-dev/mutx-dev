"""Onboarding coach service — constructs prompts, calls the LLM, and extracts onboarding state."""

from __future__ import annotations

import json
import logging
import re
from functools import lru_cache
from pathlib import Path

from openai import AsyncOpenAI

from src.api.models.pico_onboarding import (
    CoachMessage,
    OnboardingState,
    PicoChatRequest,
    PicoChatResponse,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Paths & constants
# ---------------------------------------------------------------------------

KNOWLEDGE_ROOT: Path = Path(__file__).resolve().parents[1] / "knowledge" / "pico-builder-pack"

_MODEL_NAME = "gpt-5-mini"
_TEMPERATURE = 0.3

# Regex to extract the trailing ```json {"onboarding_state": {...}} ``` block.
# Uses a non-greedy match so it captures the *last* such block in the reply.
_JSON_BLOCK_RE = re.compile(
    r"```json\s*\n(?P<json>\{.*?\})\s*\n```",
    re.DOTALL,
)

# ---------------------------------------------------------------------------
# Knowledge loaders (cached)
# ---------------------------------------------------------------------------


@lru_cache(maxsize=1)
def load_builder_system_prompt() -> str:
    """Read and cache the builder coach system prompt."""
    return (KNOWLEDGE_ROOT / "SYSTEM_PROMPT.md").read_text("utf-8").strip()


@lru_cache(maxsize=1)
def load_builder_knowledge() -> str:
    """Concatenate all .md knowledge files (except SYSTEM_PROMPT.md) into a structured context block."""
    parts: list[str] = []
    for path in sorted(KNOWLEDGE_ROOT.glob("*.md")):
        if path.name == "SYSTEM_PROMPT.md":
            continue
        title = path.stem.replace("_", " ").title()
        body = path.read_text("utf-8").strip()
        parts.append(f"## {title}\n\n{body}")
    return "\n\n---\n\n".join(parts)


# ---------------------------------------------------------------------------
# Message construction
# ---------------------------------------------------------------------------


def build_coach_messages(
    history: list[CoachMessage],
    user_message: str,
) -> list[dict]:
    """Construct the OpenAI messages array for the coach conversation.

    Layout:
      1. system  — system prompt + knowledge context
      2. history — prior turns (role/content)
      3. user    — the new user message
    """
    system_prompt = load_builder_system_prompt()
    knowledge = load_builder_knowledge()

    system_content = f"{system_prompt}\n\n## Reference Knowledge\n\n{knowledge}"

    messages: list[dict] = [
        {"role": "system", "content": system_content},
    ]

    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})

    messages.append({"role": "user", "content": user_message})

    return messages


# ---------------------------------------------------------------------------
# State extraction
# ---------------------------------------------------------------------------


def extract_onboarding_state(reply: str) -> tuple[str, OnboardingState]:
    """Parse the JSON block from the assistant reply.

    The coach is prompted to output a trailing ```json block containing
    ``{"onboarding_state": {...}}```.  We extract it, parse the state, and
    return ``(reply_without_json_block, parsed_state)``.

    If parsing fails for any reason, return ``(full_reply, OnboardingState())``.
    """
    # Find the last JSON block match — the coach always appends it at the end.
    matches = list(_JSON_BLOCK_RE.finditer(reply))
    if not matches:
        logger.debug("No JSON state block found in coach reply")
        return reply, OnboardingState()

    last_match = matches[-1]
    raw_json = last_match.group("json")

    # Strip the JSON block from the visible reply (everything before the last block).
    clean_reply = reply[: last_match.start()].rstrip()

    try:
        parsed = json.loads(raw_json)
    except json.JSONDecodeError as exc:
        logger.warning("Failed to parse coach JSON state block: %s", exc)
        return reply, OnboardingState()

    state_data = parsed.get("onboarding_state")
    if not isinstance(state_data, dict):
        logger.warning("Coach JSON block missing 'onboarding_state' key")
        return reply, OnboardingState()

    try:
        state = OnboardingState(**state_data)
    except Exception as exc:
        logger.warning("Failed to construct OnboardingState from coach output: %s", exc)
        return reply, OnboardingState()

    return clean_reply, state


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

_FALLBACK_REPLY = (
    "Hey! I'm your PicoMUTX Builder coach and I'd love to help you set up "
    "a self-hosted agent. To get started, I'll need to connect to the AI "
    "backend — please configure your API key in your settings and we can "
    "pick right back up.\n\n"
    "In the meantime, here's what I'll help you with:\n"
    "- Choose the right agent stack for your needs\n"
    "- Generate a personalized config package\n"
    "- Walk you through installation step by step"
)


async def handle_coach_chat(
    request: PicoChatRequest,
    history: list[CoachMessage],
    api_key: str | None = None,
) -> PicoChatResponse:
    """Main entry point — build messages, call the LLM, extract state, return response.

    If *api_key* is ``None`` the function returns a fallback reply with an
    empty ``OnboardingState`` so the caller can still render a helpful message.
    """
    # --- Fallback when there is no API key --------------------------------
    if not api_key:
        return PicoChatResponse(
            reply=_FALLBACK_REPLY,
            onboarding_state=OnboardingState(),
            ready_for_package=False,
        )

    # --- Build messages ----------------------------------------------------
    messages = build_coach_messages(history, request.message)

    # --- Call the model ----------------------------------------------------
    client = AsyncOpenAI(api_key=api_key)

    try:
        response = await client.chat.completions.create(
            model=_MODEL_NAME,
            temperature=_TEMPERATURE,
            messages=messages,
        )
        raw_reply: str = response.choices[0].message.content or ""
    except Exception as exc:
        logger.error("Coach LLM call failed: %s", exc)
        return PicoChatResponse(
            reply="Something went wrong reaching the AI backend. Please try again in a moment.",
            onboarding_state=OnboardingState(),
            ready_for_package=False,
        )

    # --- Extract onboarding state -----------------------------------------
    clean_reply, state = extract_onboarding_state(raw_reply)

    return PicoChatResponse(
        reply=clean_reply,
        onboarding_state=state,
        ready_for_package=state.ready,
    )
