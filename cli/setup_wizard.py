from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Callable

from cli.errors import CLIServiceError
from cli.openclaw_runtime import (
    OpenClawAgentBinding,
    OpenClawGatewayHealth,
    ensure_openclaw_installed,
    ensure_openclaw_onboarded,
    ensure_personal_assistant_binding,
    get_gateway_health,
    persist_openclaw_runtime_snapshot,
)
from cli.runtime_registry import (
    complete_wizard,
    complete_wizard_step,
    fail_wizard_step,
    load_wizard_state,
    reset_wizard_state,
    update_wizard_progress,
)

if TYPE_CHECKING:
    from cli.services.assistant import AssistantService, TemplatesService
    from cli.services.runtime import RuntimeStateService

ProgressCallback = Callable[[dict[str, Any]], None]


@dataclass(slots=True)
class SetupWizardResult:
    binding: OpenClawAgentBinding
    health: OpenClawGatewayHealth
    deployment: dict[str, Any] | None
    assistant_id: str | None
    runtime_snapshot: dict[str, Any]
    reused_existing_assistant: bool


def _progress(callback: ProgressCallback | None, *, step: str, state: str, message: str, payload: dict[str, Any] | None = None) -> None:
    if callback is None:
        return
    callback(
        {
            "step": step,
            "state": state,
            "message": message,
            "payload": payload or {},
        }
    )


def _sync_onboarding(runtime_service: RuntimeStateService | None, *, action: str, step: str | None = None) -> None:
    if runtime_service is None:
        return
    try:
        runtime_service.update_onboarding(
            action=action,
            step=step,
            payload=load_wizard_state("openclaw"),
        )
    except CLIServiceError:
        return


def _sync_snapshot(
    runtime_service: RuntimeStateService | None,
    *,
    snapshot: dict[str, Any],
) -> dict[str, Any]:
    if runtime_service is None:
        return snapshot
    try:
        record = runtime_service.put_provider("openclaw", snapshot)
    except CLIServiceError:
        return snapshot
    return record.payload


def prepare_runtime_state_sync(
    runtime_service: RuntimeStateService | None,
    *,
    binding: OpenClawAgentBinding | None = None,
    assistant_name: str | None = None,
    install_method: str,
    installation_disposition: str | None = None,
) -> dict[str, Any]:
    snapshot = persist_openclaw_runtime_snapshot(
        binding=binding,
        assistant_name=assistant_name,
        install_method=install_method,
        installation_disposition=installation_disposition,
    ).to_payload()
    synced = _sync_snapshot(runtime_service, snapshot=snapshot)
    if synced.get("last_synced_at"):
        persist_openclaw_runtime_snapshot(
            binding=binding,
            assistant_name=assistant_name,
            install_method=install_method,
            installation_disposition=installation_disposition,
            synced_at=str(synced["last_synced_at"]),
        )
    return synced


def mark_auth_completed(
    *,
    mode: str,
    provider: str,
    assistant_name: str,
    runtime_service: RuntimeStateService | None = None,
    reset: bool = False,
    progress: ProgressCallback | None = None,
) -> dict[str, Any]:
    if reset:
        reset_wizard_state(provider, mode=mode)
        _sync_onboarding(runtime_service, action="reset")
    update_wizard_progress(
        provider,
        step_id="auth",
        status="in_progress",
        mode=mode,
        assistant_name=assistant_name,
    )
    _progress(progress, step="auth", state="running", message="Authenticating operator")
    state = complete_wizard_step(
        provider,
        "auth",
        mode=mode,
        extra={"assistant_name": assistant_name},
    )
    _sync_onboarding(runtime_service, action="complete_step", step="auth")
    _progress(progress, step="auth", state="completed", message="Operator authenticated", payload=state)
    return state


def run_openclaw_setup_wizard(
    *,
    mode: str,
    assistant_name: str,
    description: str | None,
    replicas: int,
    model: str | None,
    workspace: str | None,
    install_openclaw: bool,
    openclaw_install_method: str,
    no_input: bool,
    templates_service: TemplatesService,
    assistant_service: AssistantService | None = None,
    runtime_service: RuntimeStateService | None = None,
    prompt_install: Callable[[], bool] | None = None,
    install_command_runner: Callable[[str], None] | None = None,
    onboard_command_runner: Callable[[list[str]], None] | None = None,
    progress: ProgressCallback | None = None,
) -> SetupWizardResult:
    provider = "openclaw"
    state = load_wizard_state(provider)
    if state.get("mode") != mode or state.get("status") == "completed":
        reset_wizard_state(provider, mode=mode)
        _sync_onboarding(runtime_service, action="reset")

    try:
        update_wizard_progress(
            provider,
            step_id="provider",
            status="in_progress",
            mode=mode,
            assistant_name=assistant_name,
        )
        _progress(progress, step="provider", state="running", message="Selecting runtime provider")
        provider_state = complete_wizard_step(
            provider,
            "provider",
            mode=mode,
            extra={"assistant_name": assistant_name, "selected_provider": provider},
        )
        _sync_onboarding(runtime_service, action="complete_step", step="provider")
        _progress(progress, step="provider", state="completed", message="OpenClaw selected", payload=provider_state)

        update_wizard_progress(provider, step_id="install", status="in_progress", mode=mode)
        _progress(progress, step="install", state="running", message="🦞 Checking OpenClaw install")
        install_resolution = ensure_openclaw_installed(
            install_if_missing=install_openclaw,
            install_method=openclaw_install_method,
            no_input=no_input,
            prompt_install=prompt_install,
            command_runner=install_command_runner,
        )
        install_snapshot = prepare_runtime_state_sync(
            runtime_service,
            assistant_name=assistant_name,
            install_method=install_resolution.install_method,
            installation_disposition=install_resolution.disposition,
        )
        install_state = complete_wizard_step(provider, "install", mode=mode)
        _sync_onboarding(runtime_service, action="complete_step", step="install")
        install_message = (
            f"🦞 Found OpenClaw at {install_resolution.binary_path}; importing it into MUTX tracking"
            if install_resolution.imported_existing
            else f"🦞 OpenClaw installed at {install_resolution.binary_path}; importing it into MUTX tracking"
        )
        _progress(progress, step="install", state="completed", message=install_message, payload=install_snapshot)

        update_wizard_progress(provider, step_id="onboard", status="in_progress", mode=mode)
        _progress(progress, step="onboard", state="running", message="🦞 Verifying gateway onboarding")
        health = ensure_openclaw_onboarded(
            no_input=no_input,
            command_runner=onboard_command_runner,
        )
        onboard_snapshot = prepare_runtime_state_sync(
            runtime_service,
            assistant_name=assistant_name,
            install_method=install_resolution.install_method,
            installation_disposition=install_resolution.disposition,
        )
        onboard_state = complete_wizard_step(
            provider,
            "onboard",
            mode=mode,
            extra={"gateway_url": health.gateway_url},
        )
        _sync_onboarding(runtime_service, action="complete_step", step="onboard")
        _progress(progress, step="onboard", state="completed", message="🦞 Gateway onboarded", payload=onboard_snapshot)

        update_wizard_progress(provider, step_id="track", status="in_progress", mode=mode)
        _progress(progress, step="track", state="running", message="Tracking provider under ~/.mutx")
        track_snapshot = prepare_runtime_state_sync(
            runtime_service,
            assistant_name=assistant_name,
            install_method=install_resolution.install_method,
            installation_disposition=install_resolution.disposition,
        )
        track_state = complete_wizard_step(provider, "track", mode=mode)
        _sync_onboarding(runtime_service, action="complete_step", step="track")
        _progress(progress, step="track", state="completed", message="Provider registry updated", payload=track_snapshot)

        update_wizard_progress(provider, step_id="bind", status="in_progress", mode=mode)
        _progress(progress, step="bind", state="running", message="🦞 Binding dedicated assistant runtime")
        binding = ensure_personal_assistant_binding(
            assistant_name=assistant_name,
            model=model,
            workspace=workspace,
            install_method=openclaw_install_method,
        )
        bind_snapshot = prepare_runtime_state_sync(
            runtime_service,
            binding=binding,
            assistant_name=assistant_name,
            install_method=install_resolution.install_method,
            installation_disposition=install_resolution.disposition,
        )
        bind_state = complete_wizard_step(
            provider,
            "bind",
            mode=mode,
            extra={
                "assistant_id": binding.agent_id,
                "workspace": binding.workspace,
                "gateway_url": health.gateway_url,
            },
        )
        _sync_onboarding(runtime_service, action="complete_step", step="bind")
        _progress(progress, step="bind", state="completed", message="Assistant binding ready", payload=bind_snapshot)

        update_wizard_progress(provider, step_id="deploy", status="in_progress", mode=mode)
        _progress(progress, step="deploy", state="running", message="Deploying starter assistant")
        existing_overview = assistant_service.overview() if assistant_service is not None else None
        deployment_result: dict[str, Any] | None = None
        reused_existing_assistant = existing_overview is not None
        if existing_overview is None:
            deployment_result = templates_service.deploy_template(
                "personal_assistant",
                name=assistant_name,
                description=description,
                replicas=replicas,
                model=model,
                assistant_id=binding.agent_id,
                workspace=binding.workspace,
                runtime_metadata=binding.runtime_metadata(),
            )
        deploy_state = complete_wizard_step(
            provider,
            "deploy",
            mode=mode,
            extra={
                "assistant_id": binding.agent_id,
                "workspace": binding.workspace,
            },
        )
        _sync_onboarding(runtime_service, action="complete_step", step="deploy")
        _progress(
            progress,
            step="deploy",
            state="completed",
            message="Starter assistant already present" if reused_existing_assistant else "Starter assistant deployed",
            payload=deployment_result or {"assistant_id": existing_overview.agent_id if existing_overview else None},
        )

        update_wizard_progress(provider, step_id="verify", status="in_progress", mode=mode)
        _progress(progress, step="verify", state="running", message="Verifying local health and session surface")
        health = get_gateway_health()
        verify_snapshot = prepare_runtime_state_sync(
            runtime_service,
            binding=binding,
            assistant_name=assistant_name,
            install_method=install_resolution.install_method,
            installation_disposition=install_resolution.disposition,
        )
        complete_wizard(
            provider,
            mode=mode,
            extra={
                "assistant_id": binding.agent_id,
                "workspace": binding.workspace,
                "gateway_url": health.gateway_url,
            },
        )
        _sync_onboarding(runtime_service, action="complete_step", step="verify")
        _sync_onboarding(runtime_service, action="complete")
        _progress(progress, step="verify", state="completed", message="Local runtime verified", payload=verify_snapshot)
        return SetupWizardResult(
            binding=binding,
            health=health,
            deployment=deployment_result,
            assistant_id=(deployment_result or {}).get("agent", {}).get("id")
            if deployment_result
            else getattr(existing_overview, "agent_id", None),
            runtime_snapshot=verify_snapshot,
            reused_existing_assistant=reused_existing_assistant,
        )
    except CLIServiceError as exc:
        current_state = load_wizard_state(provider)
        failed_step = str(current_state.get("current_step") or "provider")
        fail_wizard_step(
            provider,
            failed_step,
            error=str(exc),
            mode=mode,
        )
        _sync_onboarding(runtime_service, action="complete_step", step=failed_step)
        _progress(progress, step=failed_step, state="failed", message=str(exc))
        raise
