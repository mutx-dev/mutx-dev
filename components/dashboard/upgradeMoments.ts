export type UpgradePromptTone = "success" | "info" | "warning" | "error";

export type UpgradePrompt = {
  id:
    | "first-successful-run"
    | "after-deployment"
    | "repeated-runs"
    | "activity-check"
    | "failure-control";
  badge: string;
  title: string;
  message: string;
  tone: UpgradePromptTone;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

const CONTACT_HREF = "/contact";

export function getDeploymentUpgradePrompt({
  runningDeployments,
}: {
  runningDeployments: number;
}): UpgradePrompt | null {
  if (runningDeployments < 1) {
    return null;
  }

  return {
    id: "after-deployment",
    badge: "after deployment",
    title: "You now have a live agent.",
    message:
      "Want alerts if it breaks? Upgrade once the deployment is real, not after the first silent outage.",
    tone: "success",
    primaryLabel: "Upgrade for deployment alerts",
    primaryHref: CONTACT_HREF,
    secondaryLabel: "Review rollout posture",
    secondaryHref: "/dashboard/monitoring",
  };
}

export function getRunsUpgradePrompt({
  completedRuns,
  failedRuns,
  totalRuns,
}: {
  completedRuns: number;
  failedRuns: number;
  totalRuns: number;
}): UpgradePrompt | null {
  if (failedRuns > 0) {
    return {
      id: "failure-control",
      badge: "needs control",
      title: "This lane needs operator control.",
      message:
        "A failed run just turned pain into intent. Upgrade for alerts, replay, and recovery controls before the next job eats more time.",
      tone: "error",
      primaryLabel: "Upgrade for recovery control",
      primaryHref: CONTACT_HREF,
      secondaryLabel: "Inspect monitoring",
      secondaryHref: "/dashboard/monitoring",
    };
  }

  if (completedRuns == 1) {
    return {
      id: "first-successful-run",
      badge: "first success",
      title: "First successful run landed.",
      message:
        "You now have a live agent doing useful work. Upgrade while the value is obvious and before the next run needs more control.",
      tone: "success",
      primaryLabel: "Upgrade for run alerts",
      primaryHref: CONTACT_HREF,
      secondaryLabel: "See deployment state",
      secondaryHref: "/dashboard/deployments",
    };
  }

  if (completedRuns > 1 || totalRuns >= 4) {
    return {
      id: "repeated-runs",
      badge: "repeat usage",
      title: "This agent is running on repeat now.",
      message:
        "Repeated work is where blind spots get expensive. Upgrade for alerts and operator controls before queue pressure hides the next failure.",
      tone: "warning",
      primaryLabel: "Upgrade for repeat-run coverage",
      primaryHref: CONTACT_HREF,
      secondaryLabel: "Review recent runs",
      secondaryHref: "/dashboard/runs",
    };
  }

  return null;
}

export function getMonitoringUpgradePrompt({
  unresolvedAlerts,
  totalAlerts,
  healthStatus,
}: {
  unresolvedAlerts: number;
  totalAlerts: number;
  healthStatus: string;
}): UpgradePrompt | null {
  const normalizedStatus = healthStatus.trim().toLowerCase();
  const degraded = ["degraded", "failed", "error", "critical", "warning"].includes(normalizedStatus);
  const healthy = ["healthy", "ok", "ready", "success"].includes(normalizedStatus);

  if (unresolvedAlerts > 0 || degraded) {
    return {
      id: "failure-control",
      badge: "failure or control",
      title: "Something now needs control.",
      message:
        "Want alerts if it breaks? Upgrade for incident visibility, faster recovery, and a cleaner operator loop when health slips.",
      tone: "error",
      primaryLabel: "Upgrade for alerting + control",
      primaryHref: CONTACT_HREF,
      secondaryLabel: "Stay on monitoring",
      secondaryHref: "/dashboard/monitoring",
    };
  }

  if (totalAlerts > 0 || healthy) {
    return {
      id: "activity-check",
      badge: "checking activity",
      title: "You are already checking activity.",
      message:
        "That is the moment. Upgrade so the next important change reaches you first instead of making you come hunt for it.",
      tone: "info",
      primaryLabel: "Upgrade for activity alerts",
      primaryHref: CONTACT_HREF,
      secondaryLabel: "Review runs",
      secondaryHref: "/dashboard/runs",
    };
  }

  return null;
}

export function getActivityUpgradePrompt({
  eventCount,
}: {
  eventCount: number;
}): UpgradePrompt | null {
  if (eventCount < 1) {
    return null;
  }

  return {
    id: "activity-check",
    badge: "activity check",
    title: "You came here to check activity.",
    message:
      "Upgrade for alerts and operator context so the next spike, failure, or rollout reaches you before you open this feed again.",
    tone: "info",
    primaryLabel: "Upgrade for activity alerts",
    primaryHref: CONTACT_HREF,
    secondaryLabel: "Open monitoring",
    secondaryHref: "/dashboard/monitoring",
  };
}
