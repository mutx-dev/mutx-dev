"use client"

import { useEffect, useState, useCallback } from "react"
import { Activity, AlertTriangle, Bot, RefreshCcw, Rocket } from "lucide-react"

import { Card } from "@/components/ui/Card"

type HealthResponse = {
  status?: string
  error?: string
  timestamp?: string
  database?: string
}

type AgentResponse = {
  id: string
  name?: string
  status?: string
  created_at?: string
}

type DeploymentResponse = {
  id: string
  agent_id?: string
  status?: string
  replicas?: number
  started_at?: string
  ended_at?: string
  events?: Array<{ event_type: string; status: string; created_at?: string }>
  error_message?: string
}

async function readJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, { ...init, cache: "no-store" })
  const payload = await response.json().catch(() => ({ detail: "Request failed" }))
  if (!response.ok) throw new Error((payload as { detail?: string }).detail || "Request failed")
  return payload as T
}

function SignalPill({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "info" | "success" | "warning" | "danger"
}) {
  const toneClasses = {
    info: "bg-cyan-400/10 text-cyan-300 border-cyan-400/20",
    success: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
    warning: "bg-amber-400/10 text-amber-300 border-amber-400/20",
    danger: "bg-rose-400/10 text-rose-300 border-rose-400/20",
  }

  return (
    <div className={`flex flex-col gap-1 rounded-lg border px-3 py-2 text-xs ${toneClasses[tone]}`}>
      <span className="uppercase tracking-[0.1em] opacity-70">{label}</span>
      <span className="font-semibold text-base">{value}</span>
    </div>
  )
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [agents, setAgents] = useState<AgentResponse[]>([])
  const [deployments, setDeployments] = useState<DeploymentResponse[]>([])
  const [loading, setLoading] = useState({ health: true, agents: true, deployments: true })
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    const results = await Promise.allSettled([
      readJson<HealthResponse>("/api/dashboard/health").catch(() => null),
      readJson<AgentResponse[]>("/api/dashboard/agents").catch(() => []),
      readJson<DeploymentResponse[]>("/api/dashboard/deployments").catch(() => []),
    ])

    const [healthResult, agentsResult, deploymentsResult] = results

    if (healthResult.status === "fulfilled" && healthResult.value) {
      setHealth(healthResult.value)
    }
    setLoading(prev => ({ ...prev, health: false }))

    if (agentsResult.status === "fulfilled") {
      setAgents(Array.isArray(agentsResult.value) ? agentsResult.value : [])
    }
    setLoading(prev => ({ ...prev, agents: false }))

    if (deploymentsResult.status === "fulfilled") {
      setDeployments(Array.isArray(deploymentsResult.value) ? deploymentsResult.value : [])
    }
    setLoading(prev => ({ ...prev, deployments: false }))
  }, [])

  useEffect(() => {
    void loadData()
    const interval = setInterval(() => { void loadData() }, 60_000)
    return () => clearInterval(interval)
  }, [loadData])

  async function handleRefresh() {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const isLoading = loading.health && !health
  const runningAgents = agents.filter(a => a.status === "running").length
  const healthyDeployments = deployments.filter(
    d => d.status === "running" || d.status === "healthy",
  ).length
  const failedDeployments = deployments.filter(
    d => d.status === "failed" || d.status === "error",
  ).length
  const totalReplicas = deployments.reduce((sum, d) => sum + (d.replicas ?? 0), 0)

  const healthTone =
    !health && isLoading
      ? "warning"
      : health?.status === "healthy"
        ? "success"
        : health?.status === "degraded"
          ? "warning"
          : "danger"

  const agentTone = isLoading ? "warning" : runningAgents > 0 ? "success" : "info"
  const deployTone = isLoading
    ? "warning"
    : failedDeployments > 0
      ? "danger"
      : healthyDeployments > 0
        ? "success"
        : "info"

  const latestEvent = deployments
    .flatMap(d => d.events ?? [])
    .sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0
      return tb - ta
    })[0]

  return (
    <div className="space-y-4">
      {/* Overview Header — adapted from mutx-control dashboard.tsx */}
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-2xs uppercase tracking-[0.12em] text-muted-foreground">
              Overview
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              MUTX Control Plane
            </h2>
            <p className="text-xs text-muted-foreground">
              Agent fleet, deployment posture, and control plane health — synced every 60s.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400 transition hover:border-cyan-300/30 hover:text-white disabled:opacity-50"
            >
              <RefreshCcw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>

            <div className="grid grid-cols-2 gap-2 min-w-[240px]">
              <SignalPill
                label="Agents"
                value={isLoading && !agents.length ? "..." : `${runningAgents}/${agents.length}`}
                tone={agentTone}
              />
              <SignalPill
                label="Deployments"
                value={
                  isLoading && !deployments.length
                    ? "..."
                    : `${healthyDeployments}/${deployments.length}`
                }
                tone={deployTone}
              />
              <SignalPill
                label="Replicas"
                value={isLoading && !deployments.length ? "..." : String(totalReplicas)}
                tone={totalReplicas > 0 ? "success" : "info"}
              />
              <SignalPill
                label="Health"
                value={!health && isLoading ? "..." : health?.status ?? "unknown"}
                tone={healthTone}
              />
            </div>
          </div>
        </div>

        {/* Quick status strip */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
          {latestEvent ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.02] px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Latest: {latestEvent.event_type} · {latestEvent.status}
            </span>
          ) : null}
          {failedDeployments > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-rose-300">
              <AlertTriangle className="h-3 w-3" />
              {failedDeployments} deployment{failedDeployments !== 1 ? "s" : ""} failing
            </span>
          ) : null}
          {health?.error ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-amber-300">
              <AlertTriangle className="h-3 w-3" />
              {health.error}
            </span>
          ) : null}
          {health?.database ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.02] px-2.5 py-1">
              DB: {health.database}
            </span>
          ) : null}
        </div>
      </section>

      {/* Main content area */}
      {children}
    </div>
  )
}
