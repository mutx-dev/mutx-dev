"""Plan tier definitions and quotas.

This module defines the plan tiers available in MUTX and their associated
resource quotas. Used for plan enforcement and UI display.
"""

from __future__ import annotations

from enum import Enum


class PlanTier(str, Enum):
    """Available plan tiers in MUTX."""

    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    ENTERPRISE = "enterprise"

    def __str__(self) -> str:
        return self.value


class PlanQuota:
    """Quota limits for a plan tier."""

    def __init__(
        self,
        max_agents: int,
        max_deployments: int,
        max_api_keys: int,
        max_webhooks: int,
        max_replicas_per_deployment: int = 1,
        concurrent_deployments: int = 1,
        priority_support: bool = False,
        custom_branding: bool = False,
    ):
        self.max_agents = max_agents
        self.max_deployments = max_deployments
        self.max_api_keys = max_api_keys
        self.max_webhooks = max_webhooks
        self.max_replicas_per_deployment = max_replicas_per_deployment
        self.concurrent_deployments = concurrent_deployments
        self.priority_support = priority_support
        self.custom_branding = custom_branding


# Plan tier quota definitions
PLAN_QUOTAS: dict[PlanTier, PlanQuota] = {
    PlanTier.FREE: PlanQuota(
        max_agents=3,
        max_deployments=2,
        max_api_keys=2,
        max_webhooks=2,
        max_replicas_per_deployment=1,
        concurrent_deployments=1,
        priority_support=False,
        custom_branding=False,
    ),
    PlanTier.STARTER: PlanQuota(
        max_agents=10,
        max_deployments=5,
        max_api_keys=10,
        max_webhooks=10,
        max_replicas_per_deployment=2,
        concurrent_deployments=2,
        priority_support=False,
        custom_branding=False,
    ),
    PlanTier.PRO: PlanQuota(
        max_agents=50,
        max_deployments=25,
        max_api_keys=50,
        max_webhooks=50,
        max_replicas_per_deployment=5,
        concurrent_deployments=5,
        priority_support=True,
        custom_branding=True,
    ),
    PlanTier.ENTERPRISE: PlanQuota(
        max_agents=-1,  # Unlimited
        max_deployments=-1,  # Unlimited
        max_api_keys=-1,  # Unlimited
        max_webhooks=-1,  # Unlimited
        max_replicas_per_deployment=10,
        concurrent_deployments=10,
        priority_support=True,
        custom_branding=True,
    ),
}


def get_quota(plan: PlanTier | str) -> PlanQuota:
    """Get the quota configuration for a plan tier.

    Args:
        plan: The plan tier (PlanTier enum or string value)

    Returns:
        The quota configuration for the specified plan
    """
    if isinstance(plan, str):
        plan = PlanTier(plan)
    return PLAN_QUOTAS[plan]


def get_tier_display_name(plan: PlanTier | str) -> str:
    """Get the display name for a plan tier.

    Args:
        plan: The plan tier (PlanTier enum or string value)

    Returns:
        Human-readable display name
    """
    names = {
        PlanTier.FREE: "Free",
        PlanTier.STARTER: "Starter",
        PlanTier.PRO: "Pro",
        PlanTier.ENTERPRISE: "Enterprise",
    }
    if isinstance(plan, str):
        plan = PlanTier(plan)
    return names.get(plan, plan.value.capitalize())


# Default plan for new users
DEFAULT_PLAN = PlanTier.FREE
