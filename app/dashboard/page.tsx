"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bot,
  ChevronRight,
  KeyRound,
  Layers,
  ShieldCheck,
  Webhook,
} from "lucide-react";

import { DashboardOverview } from "@/components/ui/dashboard-widgets";

interface Agent {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

interface Deployment {
  id: string;
  agent_name?: string;
  agent_id?: string;
  status: string;
  created_at: string;
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
}

interface RouteCard {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  countLabel: string;
  countValue: string;
  accent: string;
}

export default function DashboardPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookRecord[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
          setError("auth_required");
          setLoading(false);
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

        if (healthRes.ok) {
          const healthData = await healthRes.json().catch(() => ({ status: "unknown" }));
          setHealth(healthData);
        } else {
          setHealth({ status: "unknown" });
        }

        setAgents(agentsData.agents || []);
        setDeployments(deploymentsData.deployments || []);
        setApiKeys(Array.isArray(apiKeysData) ? apiKeysData : apiKeysData.items || []);
        setWebhooks(webhooksData.webhooks || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const agentStats = useMemo(
    () => ({
      total: agents.length,
      running: agents.filter((agent) => agent.status === "running").length,
      stopped: agents.filter((agent) => agent.status !== "running").length,
    }),
    [agents],
  );

  const deploymentStats = useMemo(
    () => ({
      total: deployments.length,
      running: deployments.filter((deployment) => deployment.status === "running").length,
      failed: deployments.filter((deployment) => deployment.status === "failed").length,
    }),
    [deployments],
  );

  const activeWebhooks = useMemo(
    () => webhooks.filter((webhook) => webhook.is_active !== false).length,
    [webhooks],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    if (error === "auth_required") {
      return (
        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4">
          <p className="text-cyan-400">Please sign in to view your dashboard</p>
          <a href="/login" className="mt-2 inline-block text-sm font-medium text-cyan-300 hover:text-cyan-200">
            Sign in →
          </a>
        </div>
      );
    }

    return <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">{error}</div>;
  }

  const apiHealth: HealthStatus["status"] = health?.status ?? "unknown";

  const routeCards: RouteCard[] = [
    {
      title: "Agents",
      description: "Manage fleet configuration and lifecycle.",
      href: "/dashboard/agents",
      icon: Bot,
      countLabel: "Running / Total",
      countValue: `${agentStats.running} / ${agentStats.total}`,
      accent: "text-cyan-300 border-cyan-400/20 bg-cyan-400/10",
    },
    {
      title: "Deployments",
      description: "Operate active runtime deployments.",
      href: "/dashboard/deployments",
      icon: Layers,
      countLabel: "Active / Total",
      countValue: `${deploymentStats.running} / ${deploymentStats.total}`,
      accent: "text-emerald-300 border-emerald-400/20 bg-emerald-400/10",
    },
    {
      title: "API Keys",
      description: "Issue and rotate machine credentials.",
      href: "/dashboard/api-keys",
      icon: KeyRound,
      countLabel: "Registered keys",
      countValue: `${apiKeys.length}`,
      accent: "text-amber-300 border-amber-400/20 bg-amber-400/10",
    },
    {
      title: "Webhooks",
      description: "Track event delivery endpoints.",
      href: "/dashboard/webhooks",
      icon: Webhook,
      countLabel: "Active endpoints",
      countValue: `${activeWebhooks}`,
      accent: "text-purple-300 border-purple-400/20 bg-purple-400/10",
    },
    {
      title: "Monitoring",
      description: "Observe health and telemetry wiring.",
      href: "/dashboard/monitoring",
      icon: Activity,
      countLabel: "Control plane",
      countValue: String(apiHealth),
      accent: "text-sky-300 border-sky-400/20 bg-sky-400/10",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">operator overview</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">MUTX Mission Control</h1>
            <p className="mt-1 text-sm text-slate-400">
              Truthful control surface stitched from live agents, deployments, API keys, webhooks, and health.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            No fabricated metrics
          </div>
        </div>
      </section>

      <DashboardOverview
        agentStats={agentStats}
        deploymentStats={deploymentStats}
        apiHealth={apiHealth as "healthy" | "degraded" | "unhealthy" | "unknown"}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Core operator surfaces</h2>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">authenticated routes</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {routeCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-cyan-400/30 hover:bg-white/[0.04]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border ${card.accent}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500 transition group-hover:text-cyan-300" />
              </div>

              <h3 className="mt-3 text-base font-semibold text-white">{card.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{card.description}</p>

              <div className="mt-4 rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{card.countLabel}</p>
                <p className="mt-1 font-mono text-sm text-slate-100">{card.countValue}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
