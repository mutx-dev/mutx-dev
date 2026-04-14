from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import tempfile
from typing import Any

from src.api.config import get_settings
from src.api.services.reasoning_templates import get_reasoning_template

REASONING_TRACE_EVENT_TYPES = {
    "reasoning.job_created",
    "reasoning.job_dispatched",
    "reasoning.job_claimed",
    "reasoning.pass_started",
    "reasoning.critic_completed",
    "reasoning.revision_completed",
    "reasoning.synthesis_completed",
    "reasoning.judge_vote",
    "reasoning.pass_scored",
    "reasoning.incumbent_retained",
    "reasoning.incumbent_replaced",
    "reasoning.converged",
    "reasoning.artifact_registered",
    "reasoning.artifact_uploaded",
    "reasoning.artifact_synced",
    "reasoning.completed",
    "reasoning.failed",
}

DEFAULT_REASONING_MODEL = "openrouter/openai/gpt-4.1-mini"
DEFAULT_AUTHOR_TEMPERATURE = 0.4
DEFAULT_JUDGE_TEMPERATURE = 0.2
DEFAULT_MAX_TOKENS = 2400


class ReasoningEngineError(RuntimeError):
    pass


@dataclass(frozen=True)
class EngineReadiness:
    enabled: bool
    live_model_available: bool
    ready: bool
    driver: str

    def to_payload(self) -> dict[str, Any]:
        return {
            "enabled": self.enabled,
            "live_model_available": self.live_model_available,
            "ready": self.ready,
            "driver": self.driver,
        }


@dataclass(frozen=True)
class EngineEvent:
    event_type: str
    message: str
    payload: dict[str, Any]


@dataclass(frozen=True)
class EngineManagedOutput:
    role: str
    kind: str
    path: Path
    filename: str
    content_type: str | None = None
    metadata: dict[str, Any] | None = None


@dataclass(frozen=True)
class ReasoningExecutionResult:
    status: str
    output_text: str
    summary: dict[str, Any]
    artifacts: list[EngineManagedOutput]
    events: list[EngineEvent]
    driver: str


def get_reasoning_engine_readiness() -> EngineReadiness:
    settings = get_settings()
    live_model_available = any(
        [
            os.environ.get("OPENROUTER_API_KEY"),
            os.environ.get("OPENAI_API_KEY"),
            os.environ.get("ANTHROPIC_API_KEY"),
        ]
    )
    return EngineReadiness(
        enabled=settings.reasoning_enabled,
        live_model_available=live_model_available,
        ready=settings.reasoning_enabled,
        driver="llm" if live_model_available else "builtin_fallback",
    )


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _safe_int(value: Any, default: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _safe_float(value: Any, default: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _json_dump(data: Any) -> str:
    return json.dumps(data, indent=2, sort_keys=True, ensure_ascii=False)


def _load_artifact_text(artifact: dict[str, Any]) -> str:
    local_path = artifact.get("local_path")
    if not local_path:
        return ""
    path = Path(str(local_path))
    if not path.exists() or not path.is_file():
        return ""
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return ""


def _build_context_block(parameters: dict[str, Any], artifacts: list[dict[str, Any]]) -> str:
    parts: list[str] = []
    rubric = str(parameters.get("rubric") or "").strip()
    if rubric:
        parts.append(f"Rubric:\n{rubric}")

    context_chunks: list[str] = []
    for artifact in artifacts:
        if artifact.get("role") != "context":
            continue
        content = _load_artifact_text(artifact).strip()
        if not content:
            continue
        context_chunks.append(f"[{artifact.get('filename') or artifact.get('id')}]\n{content}")
    if context_chunks:
        parts.append("Context artifacts:\n" + "\n\n".join(context_chunks))

    return "\n\n".join(parts).strip()


def build_reasoning_manifest(
    job,
    artifacts: list[Any],
    output_dir: str | None = None,
) -> dict[str, Any]:
    template = get_reasoning_template(job.template_id)
    readiness = get_reasoning_engine_readiness()
    serialized_artifacts = [
        {
            "id": str(item.id),
            "role": item.role,
            "kind": item.kind,
            "storage_backend": item.storage_backend,
            "storage_uri": item.storage_uri,
            "local_path": item.local_path,
            "filename": item.filename,
            "content_type": item.content_type,
            "size_bytes": item.size_bytes,
            "metadata": item.extra_metadata or {},
        }
        for item in artifacts
    ]
    return {
        "job_id": str(job.id),
        "run_id": str(job.run_id),
        "template_id": job.template_id,
        "template_name": template.name if template else job.template_id,
        "execution_mode": job.execution_mode,
        "parameters": job.parameters or {},
        "artifacts": serialized_artifacts,
        "trace_metadata": {
            "subject_type": "reasoning_job",
            "subject_id": str(job.id),
            "subject_label": template.name if template else job.template_id,
            "template_id": job.template_id,
            "execution_mode": job.execution_mode,
        },
        "engine": readiness.to_payload(),
        "output_dir": output_dir,
    }


def _extract_text_from_openai_response(response) -> str:
    if not response.choices:
        return ""
    content = response.choices[0].message.content
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        text_parts: list[str] = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text":
                text_parts.append(str(item.get("text") or ""))
        return "".join(text_parts)
    return ""


def _extract_usage_from_openai_response(response) -> dict[str, int]:
    usage = getattr(response, "usage", None)
    return {
        "input_tokens": int(getattr(usage, "prompt_tokens", 0) or 0),
        "output_tokens": int(getattr(usage, "completion_tokens", 0) or 0),
        "total_tokens": int(getattr(usage, "total_tokens", 0) or 0),
    }


def _extract_text_from_anthropic_response(response) -> str:
    blocks = getattr(response, "content", []) or []
    text_parts: list[str] = []
    for block in blocks:
        if getattr(block, "type", None) == "text":
            text_parts.append(str(getattr(block, "text", "") or ""))
    return "".join(text_parts)


def _extract_usage_from_anthropic_response(response) -> dict[str, int]:
    usage = getattr(response, "usage", None)
    return {
        "input_tokens": int(getattr(usage, "input_tokens", 0) or 0),
        "output_tokens": int(getattr(usage, "output_tokens", 0) or 0),
        "total_tokens": int(
            (getattr(usage, "input_tokens", 0) or 0) + (getattr(usage, "output_tokens", 0) or 0)
        ),
    }


async def _invoke_model(
    *,
    model: str,
    system_prompt: str,
    user_prompt: str,
    temperature: float = DEFAULT_AUTHOR_TEMPERATURE,
    max_tokens: int = DEFAULT_MAX_TOKENS,
) -> dict[str, Any]:
    normalized_model = str(model or DEFAULT_REASONING_MODEL).strip()
    if not normalized_model:
        normalized_model = DEFAULT_REASONING_MODEL

    openrouter_key = os.environ.get("OPENROUTER_API_KEY")
    openai_key = os.environ.get("OPENAI_API_KEY")
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")

    if normalized_model.startswith("openrouter/"):
        if not openrouter_key:
            raise ReasoningEngineError("OPENROUTER_API_KEY is required for openrouter/* models")
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=openrouter_key, base_url="https://openrouter.ai/api/v1")
        response = await client.chat.completions.create(
            model=normalized_model.removeprefix("openrouter/"),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return {
            "text": _extract_text_from_openai_response(response),
            "usage": _extract_usage_from_openai_response(response),
            "provider": "openrouter",
        }

    if normalized_model.startswith("anthropic/"):
        if anthropic_key:
            from anthropic import AsyncAnthropic

            client = AsyncAnthropic(api_key=anthropic_key)
            response = await client.messages.create(
                model=normalized_model.removeprefix("anthropic/"),
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return {
                "text": _extract_text_from_anthropic_response(response),
                "usage": _extract_usage_from_anthropic_response(response),
                "provider": "anthropic",
            }
        if openrouter_key:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=openrouter_key, base_url="https://openrouter.ai/api/v1")
            response = await client.chat.completions.create(
                model=normalized_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return {
                "text": _extract_text_from_openai_response(response),
                "usage": _extract_usage_from_openai_response(response),
                "provider": "openrouter",
            }
        raise ReasoningEngineError("No provider credentials available for anthropic model")

    if normalized_model.startswith("openai/") or normalized_model.lower().startswith(
        ("gpt-", "o1", "o3", "o4")
    ):
        if openai_key:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=openai_key)
            response = await client.chat.completions.create(
                model=normalized_model.removeprefix("openai/"),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return {
                "text": _extract_text_from_openai_response(response),
                "usage": _extract_usage_from_openai_response(response),
                "provider": "openai",
            }
        if openrouter_key:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=openrouter_key, base_url="https://openrouter.ai/api/v1")
            response = await client.chat.completions.create(
                model=normalized_model.removeprefix("openai/"),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return {
                "text": _extract_text_from_openai_response(response),
                "usage": _extract_usage_from_openai_response(response),
                "provider": "openrouter",
            }
        raise ReasoningEngineError("No provider credentials available for openai model")

    if openrouter_key:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=openrouter_key, base_url="https://openrouter.ai/api/v1")
        response = await client.chat.completions.create(
            model=normalized_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return {
            "text": _extract_text_from_openai_response(response),
            "usage": _extract_usage_from_openai_response(response),
            "provider": "openrouter",
        }

    raise ReasoningEngineError(f"Unable to resolve provider for model {normalized_model}")


def _score_candidate(candidate: str, task_prompt: str, rubric: str) -> float:
    candidate_text = candidate.lower()
    task_tokens = {token for token in task_prompt.lower().split() if len(token) > 3}
    rubric_tokens = {token for token in rubric.lower().split() if len(token) > 3}
    overlap = sum(1 for token in task_tokens | rubric_tokens if token in candidate_text)
    structure_bonus = (
        1.0 if ("\n-" in candidate or "\n1." in candidate or ":" in candidate) else 0.0
    )
    brevity_penalty = max(len(candidate_text) - 2200, 0) / 500.0
    return overlap + structure_bonus - brevity_penalty


async def _run_builtin_reasoning(manifest: dict[str, Any]) -> ReasoningExecutionResult:
    parameters = manifest["parameters"] or {}
    task_prompt = str(parameters.get("task_prompt") or "").strip()
    incumbent = str(parameters.get("incumbent") or "").strip() or f"Draft answer for: {task_prompt}"
    rubric = str(parameters.get("rubric") or "").strip()
    context_block = _build_context_block(parameters, manifest.get("artifacts", []))
    max_passes = max(_safe_int(parameters.get("max_passes"), 3), 1)
    convergence_wins = max(_safe_int(parameters.get("convergence_wins"), 2), 1)
    judge_count = max(_safe_int(parameters.get("judge_count"), 3), 1)

    output_dir = Path(manifest.get("output_dir") or tempfile.mkdtemp(prefix="mutx-reasoning-"))
    output_dir.mkdir(parents=True, exist_ok=True)

    current_a = incumbent
    incumbent_wins = 0
    last_winner = "A"
    pass_log: list[dict[str, Any]] = []
    judge_ballots: list[dict[str, Any]] = []
    events: list[EngineEvent] = []

    for pass_index in range(1, max_passes + 1):
        events.append(
            EngineEvent(
                event_type="reasoning.pass_started",
                message=f"Started builtin reasoning pass {pass_index}",
                payload={"pass_index": pass_index, "driver": "builtin_fallback"},
            )
        )
        critique = "Clarify success criteria, cut filler, and keep the answer concrete."
        revision = current_a
        if "success criteria" not in revision.lower():
            revision = (
                revision.rstrip()
                + "\n\nSuccess criteria:\n- Clear next step\n- Concrete output\n- No vague filler"
            )
        synthesis = revision if len(revision) >= len(current_a) else current_a
        if context_block:
            synthesis = synthesis.rstrip() + "\n\nGrounding:\n" + context_block[:800]

        candidates = {"A": current_a, "B": revision, "AB": synthesis}
        scores = {
            key: _score_candidate(value, task_prompt, rubric) for key, value in candidates.items()
        }
        ranking = [
            item[0]
            for item in sorted(
                scores.items(), key=lambda item: (-item[1], ["A", "AB", "B"].index(item[0]))
            )
        ]
        winner = ranking[0]
        last_winner = winner

        for judge_index in range(judge_count):
            ballot = {
                "pass_index": pass_index,
                "judge_index": judge_index,
                "provider": "builtin_fallback",
                "ranking": ranking,
                "rationale": "Builtin heuristic scoring prefers grounded and structured outputs.",
            }
            judge_ballots.append(ballot)
            events.append(
                EngineEvent(
                    event_type="reasoning.judge_vote",
                    message=f"Builtin judge {judge_index + 1} ranked pass {pass_index}",
                    payload=ballot,
                )
            )

        pass_log.append(
            {
                "pass_index": pass_index,
                "critique": critique,
                "scores": scores,
                "winner": winner,
                "ranking": ranking,
            }
        )

        for key, value in candidates.items():
            (output_dir / f"pass_{pass_index:02d}_{key.lower()}.md").write_text(
                value, encoding="utf-8"
            )

        events.extend(
            [
                EngineEvent(
                    event_type="reasoning.critic_completed",
                    message=f"Builtin critic completed for pass {pass_index}",
                    payload={"pass_index": pass_index},
                ),
                EngineEvent(
                    event_type="reasoning.revision_completed",
                    message=f"Builtin revision completed for pass {pass_index}",
                    payload={"pass_index": pass_index},
                ),
                EngineEvent(
                    event_type="reasoning.synthesis_completed",
                    message=f"Builtin synthesis completed for pass {pass_index}",
                    payload={"pass_index": pass_index},
                ),
                EngineEvent(
                    event_type="reasoning.pass_scored",
                    message=f"Builtin pass {pass_index} scored",
                    payload={"pass_index": pass_index, "winner": winner, "scores": scores},
                ),
            ]
        )

        if winner == "A":
            incumbent_wins += 1
            events.append(
                EngineEvent(
                    event_type="reasoning.incumbent_retained",
                    message=f"Incumbent retained on pass {pass_index}",
                    payload={"pass_index": pass_index, "winner": winner},
                )
            )
        else:
            current_a = candidates[winner]
            incumbent_wins = 0
            events.append(
                EngineEvent(
                    event_type="reasoning.incumbent_replaced",
                    message=f"Incumbent replaced with {winner} on pass {pass_index}",
                    payload={"pass_index": pass_index, "winner": winner},
                )
            )

        if incumbent_wins >= convergence_wins:
            events.append(
                EngineEvent(
                    event_type="reasoning.converged",
                    message=f"Builtin reasoning converged after pass {pass_index}",
                    payload={
                        "pass_index": pass_index,
                        "winner": winner,
                        "convergence_wins": incumbent_wins,
                    },
                )
            )
            break

    final_output_path = output_dir / "final_output.md"
    pass_log_path = output_dir / "pass_log.json"
    judge_ballots_path = output_dir / "judge_ballots.json"
    winner_summary_path = output_dir / "winner_summary.json"

    final_output_path.write_text(current_a, encoding="utf-8")
    pass_log_path.write_text(_json_dump(pass_log), encoding="utf-8")
    judge_ballots_path.write_text(_json_dump(judge_ballots), encoding="utf-8")

    summary = {
        "winner": last_winner,
        "pass_count": len(pass_log),
        "judge_count": judge_count,
        "driver": "builtin_fallback",
        "converged": incumbent_wins >= convergence_wins,
        "final_output_length": len(current_a),
    }
    winner_summary_path.write_text(_json_dump(summary), encoding="utf-8")
    events.append(
        EngineEvent(
            event_type="reasoning.completed",
            message="Builtin reasoning workflow completed",
            payload=summary,
        )
    )

    artifacts = [
        EngineManagedOutput(
            "final_output", "markdown", final_output_path, "final_output.md", "text/markdown"
        ),
        EngineManagedOutput("pass_log", "json", pass_log_path, "pass_log.json", "application/json"),
        EngineManagedOutput(
            "judge_ballots", "json", judge_ballots_path, "judge_ballots.json", "application/json"
        ),
        EngineManagedOutput(
            "winner_summary", "json", winner_summary_path, "winner_summary.json", "application/json"
        ),
    ]
    return ReasoningExecutionResult(
        status="completed",
        output_text=current_a,
        summary=summary,
        artifacts=artifacts,
        events=events,
        driver="builtin_fallback",
    )


def _strip_code_fences(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    return cleaned


def _parse_judge_ranking(raw_text: str) -> tuple[list[str], str]:
    cleaned = _strip_code_fences(raw_text)
    try:
        payload = json.loads(cleaned)
        ranking = [
            str(item).upper()
            for item in payload.get("ranking", [])
            if str(item).upper() in {"A", "B", "AB"}
        ]
        if len(ranking) == 3:
            return ranking, str(payload.get("rationale") or "").strip()
    except json.JSONDecodeError:
        pass

    normalized = cleaned.upper()
    ranking: list[str] = []
    for token in ("AB", "A", "B"):
        if token in normalized and token not in ranking:
            ranking.append(token)
    for token in ("A", "B", "AB"):
        if token not in ranking:
            ranking.append(token)
    return ranking[:3], cleaned


def _borda_scores(ballots: list[dict[str, Any]]) -> dict[str, int]:
    scores = {"A": 0, "B": 0, "AB": 0}
    for ballot in ballots:
        ranking = ballot.get("ranking") or []
        for points, token in zip((2, 1, 0), ranking):
            if token in scores:
                scores[token] += points
    return scores


async def _run_llm_reasoning(manifest: dict[str, Any]) -> ReasoningExecutionResult:
    parameters = manifest["parameters"] or {}
    task_prompt = str(parameters.get("task_prompt") or "").strip()
    if not task_prompt:
        raise ReasoningEngineError("task_prompt is required")

    rubric = str(parameters.get("rubric") or "").strip()
    context_block = _build_context_block(parameters, manifest.get("artifacts", []))
    incumbent = str(parameters.get("incumbent") or "").strip()
    max_passes = max(_safe_int(parameters.get("max_passes"), 8), 1)
    convergence_wins = max(_safe_int(parameters.get("convergence_wins"), 2), 1)
    judge_count = max(_safe_int(parameters.get("judge_count"), 3), 1)
    author_model = str(parameters.get("author_model") or DEFAULT_REASONING_MODEL)
    critic_model = str(parameters.get("critic_model") or author_model)
    synthesizer_model = str(parameters.get("synthesizer_model") or author_model)
    judge_model = str(parameters.get("judge_model") or author_model)
    author_temperature = _safe_float(
        parameters.get("temperature_author"), DEFAULT_AUTHOR_TEMPERATURE
    )
    judge_temperature = _safe_float(parameters.get("temperature_judge"), DEFAULT_JUDGE_TEMPERATURE)
    max_tokens = max(_safe_int(parameters.get("max_tokens"), DEFAULT_MAX_TOKENS), 256)

    output_dir = Path(manifest.get("output_dir") or tempfile.mkdtemp(prefix="mutx-reasoning-"))
    output_dir.mkdir(parents=True, exist_ok=True)

    base_user_prompt = task_prompt
    if context_block:
        base_user_prompt = f"{task_prompt}\n\n{context_block}"

    if incumbent:
        current_a = incumbent
    else:
        initial = await _invoke_model(
            model=author_model,
            system_prompt="You are the initial author. Produce the strongest complete answer to the task.",
            user_prompt=base_user_prompt,
            temperature=author_temperature,
            max_tokens=max_tokens,
        )
        current_a = str(initial.get("text") or "").strip()
        if not current_a:
            raise ReasoningEngineError("Initial author returned empty output")

    pass_log: list[dict[str, Any]] = []
    judge_ballots: list[dict[str, Any]] = []
    events: list[EngineEvent] = []
    incumbent_wins = 0
    last_winner = "A"

    for pass_index in range(1, max_passes + 1):
        events.append(
            EngineEvent(
                event_type="reasoning.pass_started",
                message=f"Started reasoning pass {pass_index}",
                payload={"pass_index": pass_index},
            )
        )

        critic = await _invoke_model(
            model=critic_model,
            system_prompt="You are a critical reviewer. Find real flaws only. Do not propose fixes.",
            user_prompt=(
                f"TASK:\n{base_user_prompt}\n\nCURRENT INCUMBENT (A):\n{current_a}\n\n"
                "List concrete weaknesses, hidden assumptions, missing constraints, or wasted complexity."
            ),
            temperature=author_temperature,
            max_tokens=max_tokens,
        )
        critique = str(critic.get("text") or "").strip()
        events.append(
            EngineEvent(
                event_type="reasoning.critic_completed",
                message=f"Critic completed for pass {pass_index}",
                payload={
                    "pass_index": pass_index,
                    "model": critic_model,
                    "provider": critic.get("provider"),
                    "usage": critic.get("usage") or {},
                },
            )
        )

        revision = await _invoke_model(
            model=author_model,
            system_prompt="You are the revision author. Only change the answer when the critique justifies it.",
            user_prompt=(
                f"TASK:\n{base_user_prompt}\n\nINCUMBENT (A):\n{current_a}\n\nCRITIQUE:\n{critique}\n\n"
                "Produce revision B. Keep what still works. Make the answer stronger and more concrete."
            ),
            temperature=author_temperature,
            max_tokens=max_tokens,
        )
        version_b = str(revision.get("text") or "").strip()
        events.append(
            EngineEvent(
                event_type="reasoning.revision_completed",
                message=f"Revision completed for pass {pass_index}",
                payload={
                    "pass_index": pass_index,
                    "model": author_model,
                    "provider": revision.get("provider"),
                    "usage": revision.get("usage") or {},
                },
            )
        )

        synthesis = await _invoke_model(
            model=synthesizer_model,
            system_prompt="You are the synthesizer. Combine the strongest elements from both versions into AB.",
            user_prompt=(
                f"TASK:\n{base_user_prompt}\n\nVERSION A:\n{current_a}\n\nVERSION B:\n{version_b}\n\n"
                "Produce AB: a clean synthesis with the best parts of both versions and no filler."
            ),
            temperature=author_temperature,
            max_tokens=max_tokens,
        )
        version_ab = str(synthesis.get("text") or "").strip()
        events.append(
            EngineEvent(
                event_type="reasoning.synthesis_completed",
                message=f"Synthesis completed for pass {pass_index}",
                payload={
                    "pass_index": pass_index,
                    "model": synthesizer_model,
                    "provider": synthesis.get("provider"),
                    "usage": synthesis.get("usage") or {},
                },
            )
        )

        candidates = {"A": current_a, "B": version_b, "AB": version_ab}
        for key, value in candidates.items():
            (output_dir / f"pass_{pass_index:02d}_{key.lower()}.md").write_text(
                value, encoding="utf-8"
            )

        pass_ballots: list[dict[str, Any]] = []
        for judge_index in range(judge_count):
            judge = await _invoke_model(
                model=judge_model,
                system_prompt=(
                    "You are an independent judge. Return strict JSON with keys ranking and rationale. "
                    'ranking must be a list with exactly ["A", "B", "AB"] in best-to-worst order. '
                    "Blind judge the candidates against the task and optional rubric."
                ),
                user_prompt=(
                    f"TASK:\n{base_user_prompt}\n\nRUBRIC:\n{rubric or 'No rubric provided.'}\n\n"
                    f"CANDIDATE A:\n{current_a}\n\nCANDIDATE B:\n{version_b}\n\nCANDIDATE AB:\n{version_ab}"
                ),
                temperature=judge_temperature,
                max_tokens=max_tokens,
            )
            ranking, rationale = _parse_judge_ranking(str(judge.get("text") or ""))
            ballot = {
                "pass_index": pass_index,
                "judge_index": judge_index,
                "ranking": ranking,
                "rationale": rationale,
                "model": judge_model,
                "provider": judge.get("provider"),
                "usage": judge.get("usage") or {},
            }
            pass_ballots.append(ballot)
            judge_ballots.append(ballot)
            events.append(
                EngineEvent(
                    event_type="reasoning.judge_vote",
                    message=f"Judge {judge_index + 1} voted on pass {pass_index}",
                    payload=ballot,
                )
            )

        scores = _borda_scores(pass_ballots)
        winner = max(scores, key=lambda token: (scores[token], {"A": 2, "AB": 1, "B": 0}[token]))
        last_winner = winner
        pass_log.append(
            {
                "pass_index": pass_index,
                "critique": critique,
                "scores": scores,
                "winner": winner,
                "candidate_lengths": {key: len(value) for key, value in candidates.items()},
            }
        )
        events.append(
            EngineEvent(
                event_type="reasoning.pass_scored",
                message=f"Pass {pass_index} scored",
                payload={"pass_index": pass_index, "winner": winner, "scores": scores},
            )
        )

        if winner == "A":
            incumbent_wins += 1
            events.append(
                EngineEvent(
                    event_type="reasoning.incumbent_retained",
                    message=f"Incumbent retained on pass {pass_index}",
                    payload={"pass_index": pass_index, "winner": winner},
                )
            )
        else:
            current_a = candidates[winner]
            incumbent_wins = 0
            events.append(
                EngineEvent(
                    event_type="reasoning.incumbent_replaced",
                    message=f"Incumbent replaced with {winner} on pass {pass_index}",
                    payload={"pass_index": pass_index, "winner": winner},
                )
            )

        if incumbent_wins >= convergence_wins:
            events.append(
                EngineEvent(
                    event_type="reasoning.converged",
                    message=f"Autoreason converged after pass {pass_index}",
                    payload={
                        "pass_index": pass_index,
                        "winner": winner,
                        "convergence_wins": incumbent_wins,
                    },
                )
            )
            break

    final_output_path = output_dir / "final_output.md"
    pass_log_path = output_dir / "pass_log.json"
    judge_ballots_path = output_dir / "judge_ballots.json"
    winner_summary_path = output_dir / "winner_summary.json"

    final_output_path.write_text(current_a, encoding="utf-8")
    pass_log_path.write_text(_json_dump(pass_log), encoding="utf-8")
    judge_ballots_path.write_text(_json_dump(judge_ballots), encoding="utf-8")

    summary = {
        "winner": last_winner,
        "pass_count": len(pass_log),
        "judge_count": judge_count,
        "driver": "llm",
        "converged": incumbent_wins >= convergence_wins,
        "final_output_length": len(current_a),
    }
    winner_summary_path.write_text(_json_dump(summary), encoding="utf-8")
    events.append(
        EngineEvent(
            event_type="reasoning.completed",
            message="Autoreason workflow completed",
            payload=summary,
        )
    )

    artifacts = [
        EngineManagedOutput(
            "final_output", "markdown", final_output_path, "final_output.md", "text/markdown"
        ),
        EngineManagedOutput("pass_log", "json", pass_log_path, "pass_log.json", "application/json"),
        EngineManagedOutput(
            "judge_ballots", "json", judge_ballots_path, "judge_ballots.json", "application/json"
        ),
        EngineManagedOutput(
            "winner_summary", "json", winner_summary_path, "winner_summary.json", "application/json"
        ),
    ]
    return ReasoningExecutionResult(
        status="completed",
        output_text=current_a,
        summary=summary,
        artifacts=artifacts,
        events=events,
        driver="llm",
    )


async def execute_reasoning_manifest(manifest: dict[str, Any]) -> ReasoningExecutionResult:
    readiness = get_reasoning_engine_readiness()
    if not readiness.enabled:
        raise ReasoningEngineError("Reasoning workflows are disabled")

    if readiness.live_model_available:
        return await _run_llm_reasoning(manifest)
    return await _run_builtin_reasoning(manifest)
