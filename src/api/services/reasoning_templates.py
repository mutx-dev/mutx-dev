from __future__ import annotations

from dataclasses import dataclass, field

from src.api.models.schemas import (
    ReasoningTemplateFieldResponse,
    ReasoningTemplateOutputResponse,
    ReasoningTemplateResponse,
)


@dataclass(frozen=True)
class ReasoningTemplateField:
    name: str
    type: str
    description: str
    required: bool = True
    accepts_multiple: bool = False


@dataclass(frozen=True)
class ReasoningTemplateOutput:
    role: str
    kind: str
    description: str


@dataclass(frozen=True)
class ReasoningTemplateDefinition:
    id: str
    name: str
    summary: str
    description: str
    inputs: tuple[ReasoningTemplateField, ...] = field(default_factory=tuple)
    outputs: tuple[ReasoningTemplateOutput, ...] = field(default_factory=tuple)
    supports_managed: bool = True
    supports_local: bool = True

    def to_response(self) -> ReasoningTemplateResponse:
        return ReasoningTemplateResponse(
            id=self.id,
            name=self.name,
            summary=self.summary,
            description=self.description,
            supports_managed=self.supports_managed,
            supports_local=self.supports_local,
            inputs=[
                ReasoningTemplateFieldResponse(
                    name=item.name,
                    type=item.type,
                    description=item.description,
                    required=item.required,
                    accepts_multiple=item.accepts_multiple,
                )
                for item in self.inputs
            ],
            outputs=[
                ReasoningTemplateOutputResponse(
                    role=item.role,
                    kind=item.kind,
                    description=item.description,
                )
                for item in self.outputs
            ],
        )


REASONING_TEMPLATE_CATALOG: dict[str, ReasoningTemplateDefinition] = {
    "autoreason_refine": ReasoningTemplateDefinition(
        id="autoreason_refine",
        name="Autoreason Refine",
        summary="Run an A/B/AB refinement loop with blind judging until the incumbent survives.",
        description=(
            "Take a task prompt plus optional incumbent and context, generate adversarial and synthesis "
            "variants, judge them blindly, and stop when the incumbent keeps winning or the pass cap is hit."
        ),
        inputs=(
            ReasoningTemplateField(
                name="task_prompt",
                type="string",
                description="Primary task or question to solve.",
            ),
            ReasoningTemplateField(
                name="incumbent",
                type="string",
                description="Optional incumbent answer to refine instead of generating from scratch.",
                required=False,
            ),
            ReasoningTemplateField(
                name="context",
                type="artifact",
                description="Optional supporting context files to ground the reasoning loop.",
                required=False,
                accepts_multiple=True,
            ),
            ReasoningTemplateField(
                name="rubric",
                type="string",
                description="Optional evaluation rubric used by the judge panel.",
                required=False,
            ),
        ),
        outputs=(
            ReasoningTemplateOutput(
                role="final_output",
                kind="markdown",
                description="Final incumbent after convergence or pass exhaustion.",
            ),
            ReasoningTemplateOutput(
                role="pass_log",
                kind="json",
                description="Per-pass execution details, scores, and winner data.",
            ),
            ReasoningTemplateOutput(
                role="judge_ballots",
                kind="json",
                description="Normalized blind rankings emitted by the judge panel.",
            ),
            ReasoningTemplateOutput(
                role="winner_summary",
                kind="json",
                description="Compact summary of convergence state and final winner.",
            ),
        ),
    )
}


def list_reasoning_templates() -> list[ReasoningTemplateResponse]:
    return [definition.to_response() for definition in REASONING_TEMPLATE_CATALOG.values()]


def get_reasoning_template(template_id: str) -> ReasoningTemplateDefinition | None:
    return REASONING_TEMPLATE_CATALOG.get(template_id)
