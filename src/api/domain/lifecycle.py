"""Pure lifecycle policy for agent and deployment intent and evidence."""

from dataclasses import dataclass


ACTIVE_DEPLOYMENT_STATUSES = frozenset({"pending", "deploying", "running", "ready"})
RUNNING_DEPLOYMENT_STATUSES = frozenset({"running", "ready"})
RESTARTABLE_DEPLOYMENT_STATUSES = frozenset({"running", "ready", "failed"})
ROLLBACK_STATUSES = frozenset({"running", "ready", "stopped", "failed"})


class LifecycleConflict(ValueError):
    """Raised when an action does not apply to the current lifecycle state."""


@dataclass(frozen=True)
class DeploymentIntent:
    action: str
    desired_state: str
    status: str
    event_type: str
    event_status: str
    replicas: int
    usage_event_type: str


def deployment_intent(
    *,
    action: str,
    current_status: str,
    current_replicas: int,
    requested_replicas: int | None = None,
    current_desired_action: str | None = None,
    current_desired_state: str | None = None,
) -> DeploymentIntent:
    """Translate an accepted user action into a pending state transition."""
    if (
        current_status == "pending"
        and current_desired_action == "terminate"
        and current_desired_state == "terminated"
    ):
        raise LifecycleConflict("Cannot change a deployment while termination is pending")

    if action == "scale":
        if requested_replicas is None:
            raise LifecycleConflict("A replica count is required to scale a deployment")
        if requested_replicas == 0:
            if current_status not in ACTIVE_DEPLOYMENT_STATUSES:
                raise LifecycleConflict(f"Cannot stop deployment with status '{current_status}'")
            return DeploymentIntent(
                action="stop",
                desired_state="stopped",
                status="pending",
                event_type="stop",
                event_status="pending",
                replicas=current_replicas,
                usage_event_type="deployment_stopped",
            )
        if current_status == "stopped":
            return DeploymentIntent(
                action="start",
                desired_state="running",
                status="pending",
                event_type="start",
                event_status="pending",
                replicas=requested_replicas,
                usage_event_type="deployment_started",
            )
        if current_status in RUNNING_DEPLOYMENT_STATUSES:
            return DeploymentIntent(
                action="scale",
                desired_state="running",
                status=current_status,
                event_type="scale",
                event_status=current_status,
                replicas=requested_replicas,
                usage_event_type="deployment_scaled",
            )
        raise LifecycleConflict(f"Cannot scale deployment with status '{current_status}'")

    if action == "restart":
        if current_status not in RESTARTABLE_DEPLOYMENT_STATUSES:
            raise LifecycleConflict(
                f"Cannot restart deployment with status '{current_status}'. "
                "Only running, ready, or failed deployments can be restarted."
            )
        return DeploymentIntent(
            action="restart",
            desired_state="running",
            status="pending",
            event_type="restart",
            event_status="pending",
            replicas=current_replicas,
            usage_event_type="deployment_restarted",
        )

    if action == "terminate":
        if current_status == "killed":
            raise LifecycleConflict("Deployment is already terminated")
        return DeploymentIntent(
            action="terminate",
            desired_state="terminated",
            status="pending",
            event_type="kill",
            event_status="pending",
            replicas=current_replicas,
            usage_event_type="deployment_killed",
        )

    if action == "rollback":
        if current_status not in ROLLBACK_STATUSES:
            raise LifecycleConflict(f"Cannot rollback deployment with status '{current_status}'")
        return DeploymentIntent(
            action="rollback",
            desired_state="running",
            status="pending",
            event_type="rollback",
            event_status="pending",
            replicas=requested_replicas if requested_replicas is not None else current_replicas,
            usage_event_type="deployment_rollback",
        )

    raise LifecycleConflict(f"Unsupported deployment action '{action}'")


def deployment_completion(*, desired_state: str | None, reported_state: str) -> str | None:
    """Return the legacy deployment status only when evidence completes intent."""
    if reported_state == "failed":
        return "failed"
    if desired_state == "running" and reported_state == "running":
        return "running"
    if desired_state == "stopped" and reported_state == "stopped":
        return "stopped"
    if desired_state == "terminated" and reported_state == "stopped":
        return "killed"
    return None


def aggregate_observed_state(states: list[str | None]) -> str | None:
    """Project agent state only when the current target observations agree."""
    known = [state for state in states if state is not None]
    if not known:
        return None
    if any(state in RUNNING_DEPLOYMENT_STATUSES for state in known):
        return "running"
    if any(state == "failed" for state in known):
        return "failed"
    if len(known) != len(states):
        return None
    if all(state in {"stopped", "killed"} for state in known):
        return "stopped"
    return None
