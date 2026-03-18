"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Activity, Bot, Gauge, ServerCog, ShieldCheck, Workflow } from "lucide-react";

import {
  ControlPlaneOverview,
  ControlPlaneOverviewSkeleton,
  type OverviewHealthRow,
  type OverviewIncident,
  type OverviewKpi,
  type OverviewMetricRow,
  type OverviewRouterEntry,
  type OverviewSignal,
} from "@/components/dashboard/OverviewControlPlane";

interface Agent {
  id: string;
  name: string;
  status: string;
  created_at?: string;
}

interface Deployment {
  id: string;
  agent_id?: string;
  agent_name?: string;
  status: string;
  replicas?: number;
  created_at?: string;
  started_at?: string | null;
  ended_at?: string | null;
  error_message?: string | null;
}

interface ApiKeyRecord {
  id: string;
}

interface WebhookRecord {
  id: string;
  is_active?: boolean;
}

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy" | "unknown" | string;
  error?: string | null;
}

interface DeploymentEventRecord {
  id?: string;
  event_type?: string;
  status?: string;
  error_message?: string | null;
  created_at?: string;
  timestamp?: string;
}

interface DeploymentIncidentEnvelope {
  deploymentId: string;
  agentId?: string;
  event: DeploymentEventRecord;
}

function toLower(value?: string | null) {
  return (value ?? "").toLowerCase();
}

function isErrorStatus(status?: string | null) {
  const normalized = toLower(status);
  return normalized.includes("error") || normalized.includes("fail") || normalized.includes("unhealthy");
}

function isWarnStatus(status?: string | null) {
  const normalized = toLower(status);
  return (
    normalized.includes("degraded") ||
    normalized.includes("warn") ||
    normalized.includes("pending") ||
    normalized.includes("creating") ||
    normalized.includes("starting") ||
    normalized.includes("stopped")
  );
}

function isQueuedDeployment(status?: string | null) {
  const normalized = toLower(status);
  return (
    normalized.includes("queued") ||
    normalized.includes("pending") ||
    normalized.includes("creating") ||
    normalized.includes("starting") ||
    normalized.includes("restarting")
  );
}

function shortId(value?: string | null, size = 8) {
  if (!value) return "unknown";
  return value.length <= size ? value : value.slice(0, size);
}

function formatRelativeTime(value?: string | null) {
  if (!value) return "unknown";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "unknown";

  const diffMs = timestamp - Date.now();
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const minutes = Math.round(diffMs / 60000);

  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");

  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 48) return formatter.format(hours, "hour");

  const days = Math.round(hours / 24);
  return formatter.format(days, "day");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function normalizeDeploymentEvents(payload: unknown): DeploymentEventRecord[] {
  if (Array.isArray(payload)) return payload as DeploymentEventRecord[];

  const record = asRecord(payload);
  if (!record) return [];

  if (Array.isArray(record.items)) return record.items as DeploymentEventRecord[];
  if (Array.isArray(record.events)) return record.events as DeploymentEventRecord[];

  return [];
}

function mapHealthTone(status: string): "good" | "warn" | "bad" | "info" {
  if (toLower(status) === "healthy") return "good";
  if (toLower(status) === "degraded") return "warn";
  if (toLower(status) === "unhealthy") return "bad";
  return "info";
}

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookRecord[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [incidents, setIncidents] = useState<OverviewIncident[]>([]);
  const [incidentsNote, setIncidentsNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [agentsRes, deploymentsRes, healthRes, apiKeysRes, webhooksRes] = await Promise.all([
          fetch("/api/dashboard/agents", { cache: "no-store" }),
          fetch("/api/dashboard/deployments", { cache: "no-store" }),
          fetch("/api/dashboard/health", { cache: "no-store" }),
          fetch("/api/api-keys", { cache: "no-store" }),
          fetch("/api/webhooks", { cache: "no-store" }),
        ]);

        if (
          [agentsRes, deploymentsRes, apiKeysRes, webhooksRes].some((response) => response.status === 401)
        ) {
          if (!cancelled) {
            setError("auth_required");
            setLoading(false);
          }
          return;
        }

        if (!agentsRes.ok || !deploymentsRes.ok) {
          throw new Error("Failed to fetch overview data");
        }

        const [agentsData, deploymentsData, apiKeysData, webhooksData] = await Promise.all([
          agentsRes.json(),
          deploymentsRes.json(),
          apiKeysRes.ok ? apiKeysRes.json() : Promise.resolve([]),
          webhooksRes.ok ? webhooksRes.json() : Promise.resolve({ webhooks: [] }),
        ]);

        const nextAgents: Agent[] = Array.isArray(agentsData?.agents) ? agentsData.agents : [];
        const nextDeployments: Deployment[] = Array.isArray(deploymentsData?.deployments)
          ? deploymentsData.deployments
          : [];

        const nextApiKeys: ApiKeyRecord[] = Array.isArray(apiKeysData)
          ? apiKeysData
          : Array.isArray(apiKeysData?.items)
            ? apiKeysData.items
            : [];

        const nextWebhooks: WebhookRecord[] = Array.isArray(webhooksData?.webhooks) ? webhooksData.webhooks : [];

        if (!cancelled) {
          setAgents(nextAgents);
          setDeployments(nextDeployments);
          setApiKeys(nextApiKeys);
          setWebhooks(nextWebhooks);
        }

        if (!cancelled) {
          if (healthRes.ok) {
            const healthPayload = await healthRes.json().catch(() => ({ status: "unknown" }));
            setHealth(healthPayload);
          } else {
            setHealth({ status: "unknown" });
          }
        }

        const selectedDeployments = nextDeployments.slice(0, 6);
        if (selectedDeployments.length === 0) {
          if (!cancelled) {
            setIncidents([]);
            setIncidentsNote("No deployments available yet. Incident stream will populate when deployments start.");
          }
          return;
        }

        const incidentResults = await Promise.allSettled(
          selectedDeployments.map(async (deployment): Promise<DeploymentIncidentEnvelope[]> => {
            const response = await fetch(
              `/api/deployments/${encodeURIComponent(deployment.id)}/events?limit=6`,
              { cache: "no-store" },
            );

            if (!response.ok) {
              throw new Error(`events_${response.status}`);
            }

            const payload = await response.json().catch(() => ({}));
            const events = normalizeDeploymentEvents(payload);

            return events.map((event) => ({
              deploymentId: deployment.id,
              agentId: deployment.agent_id,
              event,
            }));
          }),
        );

        const eventFailures = incidentResults.filter((result) => result.status === "rejected").length;
        const eventEnvelopes = incidentResults
          .filter((result): result is PromiseFulfilledResult<DeploymentIncidentEnvelope[]> => result.status === "fulfilled")
          .flatMap((result) => result.value);

        const agentNameById = new Map(nextAgents.map((agent) => [agent.id, agent.name]));

        const mappedIncidents = eventEnvelopes
          .map((envelope, index): OverviewIncident => {
            const eventType = readString(envelope.event.event_type)?.replace(/_/g, " ") ?? "lifecycle update";
            const eventStatus = readString(envelope.event.status);
            const eventError = readString(envelope.event.error_message);
            const severity = eventError || isErrorStatus(eventStatus)
              ? "error"
              : isWarnStatus(eventStatus)
                ? "warning"
                : "info";

            const sourceAgent = envelope.agentId ? agentNameById.get(envelope.agentId) ?? shortId(envelope.agentId) : "unknown";
            const occurredAt =
              formatRelativeTime(readString(envelope.event.created_at) ?? readString(envelope.event.timestamp));

            return {
              id: readString(envelope.event.id) ?? `${envelope.deploymentId}-${index}`,
              level: severity,
              title: `deployment:${shortId(envelope.deploymentId)} • ${eventType}`,
              detail: eventError ?? (eventStatus ? `status ${eventStatus}` : "event recorded"),
              source: `agent:${sourceAgent}`,
              occurredAt,
            };
          })
          .slice(0, 16);

        const fallbackDeploymentIncidents: OverviewIncident[] = nextDeployments
          .filter((deployment) => isErrorStatus(deployment.status))
          .map((deployment, index) => {
            const sourceAgent = deployment.agent_id
              ? agentNameById.get(deployment.agent_id) ?? shortId(deployment.agent_id)
              : "unknown";

            return {
              id: `fallback-${deployment.id}-${index}`,
              level: "error",
              title: `deployment:${shortId(deployment.id)} • runtime failure`,
              detail: deployment.error_message ?? `status ${deployment.status}`,
              source: `agent:${sourceAgent}`,
              occurredAt: formatRelativeTime(deployment.ended_at ?? deployment.started_at ?? deployment.created_at),
            };
          });

        const nextIncidents = [...mappedIncidents, ...fallbackDeploymentIncidents].slice(0, 12);

        if (!cancelled) {
          setIncidents(nextIncidents);

          if (eventFailures > 0) {
            setIncidentsNote(
              `Event stream unavailable for ${eventFailures} deployment${eventFailures === 1 ? "" : "s"}; showing available incident signals.`,
            );
          } else if (nextIncidents.length === 0) {
            setIncidentsNote("No incident events reported in the current deployment scope.");
          } else {
            setIncidentsNote(null);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  const apiHealth: HealthStatus["status"] = health?.status ?? "unknown";

  const agentStats = useMemo(
    () => ({
      total: agents.length,
      running: agents.filter((agent) => toLower(agent.status) === "running").length,
      stopped: agents.filter((agent) => toLower(agent.status) !== "running").length,
    }),
    [agents],
  );

  const deploymentStats = useMemo(
    () => ({
      total: deployments.length,
      running: deployments.filter((deployment) => toLower(deployment.status) === "running").length,
      failed: deployments.filter((deployment) => isErrorStatus(deployment.status)).length,
    }),
    [deployments],
  );

  const queuedDeployments = useMemo(
    () => deployments.filter((deployment) => isQueuedDeployment(deployment.status)).length,
    [deployments],
  );

  const activeWebhooks = useMemo(
    () => webhooks.filter((webhook) => webhook.is_active !== false).length,
    [webhooks],
  );

  const agentNameById = useMemo(() => new Map(agents.map((agent) => [agent.id, agent.name])), [agents]);

  const routerEntries = useMemo<OverviewRouterEntry[]>(
    () =>
      deployments.slice(0, 10).map((deployment) => {
        const label = deployment.agent_name ?? (deployment.agent_id ? agentNameById.get(deployment.agent_id) : undefined);
        const routeStatus = isErrorStatus(deployment.status)
          ? "bad"
          : isWarnStatus(deployment.status)
            ? "warn"
            : toLower(deployment.status) === "running"
              ? "good"
              : "info";

        return {
          id: deployment.id,
          primary: `agent:${label ?? shortId(deployment.agent_id)}`,
          secondary: `deployment:${shortId(deployment.id, 12)}`,
          statusLabel: deployment.status,
          statusTone: routeStatus,
          meta: `${deployment.replicas ?? 1} replica${(deployment.replicas ?? 1) === 1 ? "" : "s"}`,
          ageLabel: formatRelativeTime(deployment.started_at ?? deployment.created_at ?? deployment.ended_at),
        };
      }),
    [deployments, agentNameById],
  );

  const incidentErrorCount = useMemo(
    () => incidents.filter((incident) => incident.level === "error").length,
    [incidents],
  );

  const totalErrorSignals = Math.max(incidentErrorCount, deploymentStats.failed);
  const loadRatio = deploymentStats.total > 0 ? Math.round((deploymentStats.running / deploymentStats.total) * 100) : null;

  const gatewayLabel =
    apiHealth === "healthy"
      ? "Online"
      : apiHealth === "degraded"
        ? "Degraded"
        : apiHealth === "unhealthy"
          ? "Offline"
          : "Unknown";

  const signals: OverviewSignal[] = [
    { label: "Mode", value: "Gateway", tone: "info" },
    { label: "Events", value: `${incidents.length} stream`, tone: incidents.length > 0 ? "good" : "info" },
    { label: "Queue", value: String(queuedDeployments), tone: queuedDeployments > 0 ? "warn" : "good" },
    { label: "Errors", value: String(totalErrorSignals), tone: totalErrorSignals > 0 ? "warn" : "good" },
  ];

  const kpis: OverviewKpi[] = [
    {
      title: "Gateway",
      value: gatewayLabel,
      subtitle: "transport status",
      detail: apiHealth === "unknown" && health?.error ? health.error : undefined,
      tone: "gateway",
      icon: ShieldCheck,
    },
    {
      title: "Sessions",
      value: `${deploymentStats.running}/${deploymentStats.total}`,
      subtitle: "active / total",
      detail: "deployment-backed proxy",
      tone: "blue",
      icon: Workflow,
    },
    {
      title: "Agent Capacity",
      value: String(agentStats.running),
      subtitle: `${agentStats.total} total`,
      tone: "green",
      icon: Bot,
    },
    {
      title: "Queue",
      value: String(queuedDeployments),
      subtitle: "pending deployments",
      tone: "violet",
      icon: ServerCog,
    },
    {
      title: "System Load",
      value: loadRatio == null ? "n/a" : `${loadRatio}%`,
      subtitle: "running deployment ratio",
      detail: loadRatio == null ? "awaiting deployment metrics contract" : undefined,
      tone: "slate",
      icon: Gauge,
    },
  ];

  const healthRows: OverviewHealthRow[] = [
    { label: "Gateway", value: gatewayLabel, tone: mapHealthTone(apiHealth) },
    {
      label: "Traffic (deployments)",
      value: String(deploymentStats.total),
      tone: deploymentStats.total > 0 ? "good" : "info",
    },
    { label: "Errors (24h proxy)", value: String(totalErrorSignals), tone: totalErrorSignals > 0 ? "warn" : "good" },
    {
      label: "Saturation (queue)",
      value: String(queuedDeployments),
      tone: queuedDeployments > 4 ? "bad" : queuedDeployments > 0 ? "warn" : "good",
      bar: deploymentStats.total > 0 ? Math.round((queuedDeployments / deploymentStats.total) * 100) : 0,
    },
    {
      label: "Webhooks (active)",
      value: String(activeWebhooks),
      tone: activeWebhooks > 0 ? "good" : "info",
    },
    {
      label: "API Keys",
      value: String(apiKeys.length),
      tone: apiKeys.length > 0 ? "info" : "warn",
    },
  ];

  const taskRows: OverviewMetricRow[] = [
    { label: "Inbox", value: "n/a", tone: "info" },
    { label: "Assigned", value: "n/a", tone: "info" },
    { label: "In Progress", value: "n/a", tone: "info" },
    { label: "Review", value: "n/a", tone: "info" },
    { label: "Done", value: "n/a", tone: "info" },
    { label: "Backlog", value: "n/a", tone: "info" },
  ];

  const securityRows: OverviewMetricRow[] = [
    {
      label: "API keys (registered)",
      value: String(apiKeys.length),
      tone: apiKeys.length > 0 ? "good" : "warn",
    },
    {
      label: "Webhook endpoints (active)",
      value: String(activeWebhooks),
      tone: activeWebhooks > 0 ? "good" : "info",
    },
    { label: "Login failures (24h)", value: "n/a", tone: "info" },
    { label: "Unread notifications", value: "n/a", tone: "info" },
  ];

  if (loading) {
    return <ControlPlaneOverviewSkeleton />;
  }

  if (error) {
    if (error === "auth_required") {
      return (
        <section className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">Auth Required</p>
          <h1 className="mt-2 text-lg font-semibold text-cyan-100">Sign in to view gateway overview.</h1>
          <p className="mt-1 text-sm text-cyan-200/80">
            Dashboard data is scoped to authenticated control-plane ownership.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-cyan-200 transition hover:text-cyan-100"
          >
            Open login
          </Link>
        </section>
      );
    }

    return (
      <section className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-300/80">Overview Error</p>
        <h1 className="mt-2 text-lg font-semibold text-rose-100">Failed to load control-plane overview.</h1>
        <p className="mt-1 text-sm text-rose-200/80">{error}</p>
      </section>
    );
  }

  return (
    <ControlPlaneOverview
      title="Gateway Control Plane"
      subtitle="Gateway-first health, session routing, queue pressure, and incident response signals."
      signals={signals}
      kpis={kpis}
      healthRows={healthRows}
      routerEntries={routerEntries}
      incidents={incidents}
      incidentsNote={incidentsNote}
      taskRows={taskRows}
      taskFootnote="Task-state aggregate contract is not wired in this workspace yet."
      securityRows={securityRows}
      securityTag="Partial coverage"
      securityHref="/dashboard/control"
      securityHrefLabel="View Security Surface"
    />
  );
}
