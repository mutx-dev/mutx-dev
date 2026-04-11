'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import type { components } from '@/app/types/api'
import { usePicoProgress } from '@/components/pico/usePicoProgress'
import { usePicoHref } from '@/lib/pico/navigation'

type AssistantOverviewEnvelope = components['schemas']['AssistantOverviewEnvelope']
type AssistantOverview = components['schemas']['AssistantOverviewResponse']
type DeploymentResponse = components['schemas']['DeploymentResponse']

type PicoAgentLoopCardProps = {
  context: 'academy' | 'autopilot'
}

type AgentAction = 'deploy' | 'stop'

function extractErrorMessage(payload: unknown, fallbackMessage: string) {
  if (!payload || typeof payload !== 'object') {
    return fallbackMessage
  }

  const candidate = payload as {
    detail?: unknown
    message?: unknown
    error?: unknown
  }

  if (typeof candidate.detail === 'string' && candidate.detail.trim()) {
    return candidate.detail
  }

  if (typeof candidate.message === 'string' && candidate.message.trim()) {
    return candidate.message
  }

  if (typeof candidate.error === 'string' && candidate.error.trim()) {
    return candidate.error
  }

  return fallbackMessage
}

async function readJsonSafely(response: Response) {
  return response.json().catch(() => null)
}

function sortDeployments(deployments: DeploymentResponse[] = []) {
  return [...deployments].sort((left, right) => {
    const leftTime = left.started_at ? Date.parse(left.started_at) : 0
    const rightTime = right.started_at ? Date.parse(right.started_at) : 0
    return rightTime - leftTime
  })
}

function formatTimestamp(value?: string | null) {
  if (!value) {
    return 'n/a'
  }

  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) {
    return value
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp))
}

function getCardCopy(context: 'academy' | 'autopilot') {
  if (context === 'academy') {
    return {
      eyebrow: 'Live loop',
      title: 'Deploy the real starter agent from Pico',
      description:
        'This uses the existing MUTX starter-template flow. No mock agent. No fake receipt. When it lands, open Autopilot and control it there.',
    }
  }

  return {
    eyebrow: 'Agent control',
    title: 'Deploy, inspect, stop, or restart without leaving Pico',
    description:
      'This card stays on the real control-plane rails: starter deploys, deployment state, and lifecycle actions already shipped in MUTX.',
  }
}

export function PicoAgentLoopCard({ context }: PicoAgentLoopCardProps) {
  const pathname = usePathname()
  const toHref = usePicoHref()
  const { actions } = usePicoProgress()
  const [overview, setOverview] = useState<AssistantOverviewEnvelope | null>(null)
  const [loading, setLoading] = useState(true)
  const [authRequired, setAuthRequired] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deploying, setDeploying] = useState(false)
  const [acting, setActing] = useState<AgentAction | null>(null)
  const [nameDraft, setNameDraft] = useState('Pico Starter Assistant')
  const [workspaceDraft, setWorkspaceDraft] = useState('pico-starter')
  const [lastReceipt, setLastReceipt] = useState<{ agentId: string; deploymentId: string } | null>(null)

  const assistant = overview?.assistant ?? null
  const deployments = useMemo(() => sortDeployments(assistant?.deployments ?? []), [assistant?.deployments])
  const latestDeployment = deployments[0] ?? null
  const loginHref = `/login?next=${encodeURIComponent(pathname || '/pico/onboarding')}`
  const copy = getCardCopy(context)

  async function load() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/dashboard/assistant/overview', {
        credentials: 'include',
        cache: 'no-store',
      })

      const payload = await readJsonSafely(response)

      if (response.status === 401) {
        setAuthRequired(true)
        setOverview(null)
        return
      }

      if (!response.ok) {
        throw new Error(extractErrorMessage(payload, 'Failed to load assistant overview'))
      }

      const nextOverview = (payload ?? null) as AssistantOverviewEnvelope | null
      setOverview(nextOverview)
      setAuthRequired(false)

      if (nextOverview?.assistant?.deployments?.length) {
        actions.unlockMilestone('successful_deployment')
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load assistant overview')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function deployStarterAgent() {
    setDeploying(true)
    setError(null)
    setLastReceipt(null)

    try {
      const response = await fetch('/api/dashboard/templates/personal_assistant/deploy', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: nameDraft.trim() || 'Pico Starter Assistant',
          workspace: workspaceDraft.trim() || undefined,
          runtime_metadata: {
            source: 'pico',
            entrypoint: context,
          },
        }),
      })

      const payload = await readJsonSafely(response)

      if (response.status === 401) {
        setAuthRequired(true)
        throw new Error('Sign in to deploy the starter agent.')
      }

      if (!response.ok) {
        throw new Error(extractErrorMessage(payload, 'Failed to deploy starter agent'))
      }

      const receipt = payload as {
        agent?: { id?: string }
        deployment?: { id?: string }
      }

      setLastReceipt({
        agentId: String(receipt.agent?.id ?? ''),
        deploymentId: String(receipt.deployment?.id ?? ''),
      })
      actions.unlockMilestone('successful_deployment')
      await load()
    } catch (deployError) {
      setError(deployError instanceof Error ? deployError.message : 'Failed to deploy starter agent')
    } finally {
      setDeploying(false)
    }
  }

  async function mutateAgent(action: AgentAction) {
    if (!assistant) {
      return
    }

    setActing(action)
    setError(null)

    try {
      const response = await fetch(`/api/dashboard/agents/${encodeURIComponent(assistant.agent_id)}?action=${action}`, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      })

      const payload = await readJsonSafely(response)

      if (response.status === 401) {
        setAuthRequired(true)
        throw new Error('Sign in again to control this agent.')
      }

      if (!response.ok) {
        throw new Error(extractErrorMessage(payload, `Failed to ${action} agent`))
      }

      await load()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : `Failed to ${action} agent`)
    } finally {
      setActing(null)
    }
  }

  const assistantStatus = assistant?.status ?? 'not deployed'
  const deploymentStatus = latestDeployment?.status ?? 'not deployed'
  const primaryActionLabel = assistant?.status === 'running' ? 'Stop agent' : 'Start agent'
  const primaryAction = assistant?.status === 'running' ? 'stop' : 'deploy'

  return (
    <section className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{copy.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{copy.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{copy.description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            Refresh loop state
          </button>
          <Link href={toHref('/autopilot')} className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950">
            Open Autopilot
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-4">
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Lesson</p>
          <p className="mt-2 text-lg font-semibold text-white">Start</p>
          <p className="mt-2">Use the academy stepper. The lesson UI is the front door, not the fake finish line.</p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Deploy</p>
          <p className="mt-2 text-lg font-semibold text-white">{assistant ? assistant.name : 'Starter template'}</p>
          <p className="mt-2">Status: {assistantStatus}</p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">See it run</p>
          <p className="mt-2 text-lg font-semibold text-white">{deploymentStatus}</p>
          <p className="mt-2">Latest deployment started {formatTimestamp(latestDeployment?.started_at)}</p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Control</p>
          <p className="mt-2 text-lg font-semibold text-white">{assistant ? 'Live controls ready' : 'Waiting on deploy'}</p>
          <p className="mt-2">Thresholds, approvals, and lifecycle actions stay inside Pico.</p>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">Loading starter-agent state...</div>
      ) : null}

      {authRequired ? (
        <div className="mt-5 rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-5 text-sm text-amber-50">
          <p className="font-medium text-white">Authentication required</p>
          <p className="mt-2">The academy still works offline, but a real deploy needs your MUTX session.</p>
          <Link href={loginHref} className="mt-4 inline-flex rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950">
            Sign in and come back
          </Link>
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 rounded-[24px] border border-rose-400/20 bg-rose-400/10 p-5 text-sm text-rose-50">{error}</div>
      ) : null}

      {lastReceipt ? (
        <div className="mt-5 rounded-[24px] border border-emerald-400/20 bg-emerald-400/10 p-5 text-sm text-emerald-50">
          <p className="font-medium text-white">Starter agent deployed</p>
          <p className="mt-2">Agent id: {lastReceipt.agentId || 'pending'}</p>
          <p className="mt-1">Deployment id: {lastReceipt.deploymentId || 'pending'}</p>
        </div>
      ) : null}

      {!authRequired && !assistant ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr,auto]">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-slate-300">
              <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Agent name</span>
              <input
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] px-4 py-3 text-sm text-slate-100 outline-none"
              />
            </label>
            <label className="block text-sm text-slate-300">
              <span className="block text-xs uppercase tracking-[0.18em] text-slate-500">Workspace</span>
              <input
                value={workspaceDraft}
                onChange={(event) => setWorkspaceDraft(event.target.value)}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] px-4 py-3 text-sm text-slate-100 outline-none"
              />
            </label>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => void deployStarterAgent()}
              disabled={deploying || loading}
              className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deploying ? 'Deploying starter...' : 'Deploy starter agent'}
            </button>
          </div>
        </div>
      ) : null}

      {assistant ? (
        <div className="mt-5 grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
          <div className="space-y-4">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Live agent</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{assistant.name}</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Agent status</p>
                  <p className="mt-1">{assistant.status}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Workspace</p>
                  <p className="mt-1">{assistant.workspace}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Deployments</p>
                  <p className="mt-1">{deployments.length}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Channels</p>
                  <p className="mt-1">{assistant.channels?.filter((channel) => channel.enabled).length ?? 0} enabled</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void mutateAgent(primaryAction)}
                  disabled={acting !== null}
                  className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {acting === primaryAction ? 'Working...' : primaryActionLabel}
                </button>
                <Link href={toHref('/academy/see-your-agent-activity')} className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200">
                  Review the monitoring lesson
                </Link>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Why this matters</p>
              <p className="mt-3">
                Pico now owns the real handoff: lesson context, starter deployment, live status, and the control actions that matter when something goes sideways.
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Deployment timeline</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Latest starter activity</h3>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                {latestDeployment?.status ?? 'none'}
              </span>
            </div>
            {latestDeployment ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] p-4">
                  <p className="font-medium text-white">Deployment {latestDeployment.id}</p>
                  <p className="mt-2">Started: {formatTimestamp(latestDeployment.started_at)}</p>
                  <p className="mt-1">Replicas: {latestDeployment.replicas}</p>
                  <p className="mt-1">Version: {latestDeployment.version ?? 'n/a'}</p>
                </div>
                {(latestDeployment.events ?? []).slice(0, 4).map((event) => (
                  <div key={event.id} className="rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] p-4">
                    <p className="font-medium text-white">{event.event_type}</p>
                    <p className="mt-1">Status: {event.status ?? 'n/a'}</p>
                    <p className="mt-1">At: {formatTimestamp(event.created_at)}</p>
                    {event.error_message ? <p className="mt-2 text-rose-200">{event.error_message}</p> : null}
                  </div>
                ))}
                {latestDeployment.events?.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] p-4">
                    No lifecycle events yet. Refresh after the control plane posts the next update.
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] p-4">
                No deployment record yet. Deploy the starter agent first.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  )
}
