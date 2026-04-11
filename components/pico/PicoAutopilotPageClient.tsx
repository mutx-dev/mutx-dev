'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { PicoShell } from '@/components/pico/PicoShell'
import { usePicoProgress } from '@/components/pico/usePicoProgress'
import { PICO_PLAN_MATRIX } from '@/lib/pico/academy'

type RunSummary = {
  id: string
  status: string
  started_at?: string
  completed_at?: string
  agent_id?: string
}

type BudgetSummary = {
  plan: string
  credits_total: number
  credits_used: number
  credits_remaining: number
  usage_percentage: number
}

type AlertSummary = {
  id: string
  message: string
  resolved: boolean
  type: string
  created_at: string
}

type ApprovalExecutionSummary = {
  status?: string
  detail?: string
  deployment_id?: string
  agent_id?: string
  agent_name?: string
  template_id?: string
}

type StarterDeploymentRequest = {
  name: string
  description?: string
  replicas?: number
  workspace?: string
  skills?: string[]
  runtime_metadata?: Record<string, unknown>
}

type ApprovalPayload = {
  summary?: string
  kind?: string
  template_id?: string
  deployment_request?: StarterDeploymentRequest
  execution?: ApprovalExecutionSummary
}

type ApprovalSummary = {
  id: string
  action_type: string
  status: string
  requester: string
  created_at: string
  agent_id: string
  payload?: ApprovalPayload
}

type StarterDeploymentResponse = {
  agent?: {
    id?: string
    name?: string
  }
  deployment?: {
    id?: string
  }
}

type ControlledActionReceipt = {
  tone: 'success' | 'queued' | 'warning'
  title: string
  description: string
}

const STARTER_TEMPLATE_ID = 'personal_assistant'
const STARTER_DEPLOYMENT_REQUEST: StarterDeploymentRequest = {
  name: 'Pico Autopilot Assistant',
  description: 'Starter assistant deployed from Pico autopilot.',
  replicas: 1,
  workspace: 'pico-autopilot',
  skills: ['hermes-agent'],
  runtime_metadata: {
    source: 'pico-autopilot',
  },
}

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

  if (candidate.error && typeof candidate.error === 'object') {
    const nestedError = candidate.error as { message?: unknown }
    if (typeof nestedError.message === 'string' && nestedError.message.trim()) {
      return nestedError.message
    }
  }

  return fallbackMessage
}

async function readJsonSafely(response: Response) {
  return response.json().catch(() => null)
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

function formatTimestamp(value?: string) {
  if (!value) return 'n/a'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString()
}

function buildStarterApprovalPayload(): ApprovalPayload {
  return {
    summary: 'Deploy the Pico starter assistant.',
    kind: 'starter_template_deploy',
    template_id: STARTER_TEMPLATE_ID,
    deployment_request: STARTER_DEPLOYMENT_REQUEST,
  }
}

export function PicoAutopilotPageClient() {
  const { progress, actions } = usePicoProgress()
  const [runs, setRuns] = useState<RunSummary[]>([])
  const [budget, setBudget] = useState<BudgetSummary | null>(null)
  const [alerts, setAlerts] = useState<AlertSummary[]>([])
  const [approvals, setApprovals] = useState<ApprovalSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [authRequired, setAuthRequired] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<ControlledActionReceipt | null>(null)
  const [thresholdDraft, setThresholdDraft] = useState(progress.autopilot.costThresholdPercent)
  const [runningStarterAction, setRunningStarterAction] = useState(false)
  const [resolvingApprovalId, setResolvingApprovalId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)

    try {
      const [runsResponse, budgetResponse, alertsResponse, approvalsResponse] = await Promise.all([
        fetch('/api/dashboard/runs?limit=8', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/dashboard/budgets', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/dashboard/monitoring/alerts?limit=8', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/pico/approvals?status=PENDING', { credentials: 'include', cache: 'no-store' }),
      ])

      if ([runsResponse, budgetResponse, alertsResponse, approvalsResponse].some((response) => response.status === 401)) {
        setAuthRequired(true)
        setRuns([])
        setBudget(null)
        setAlerts([])
        setApprovals([])
        setLoading(false)
        return
      }

      if ([runsResponse, budgetResponse, alertsResponse, approvalsResponse].some((response) => !response.ok)) {
        setError('Some live autopilot signals could not be loaded. Refresh to retry.')
      }

      const runsPayload = runsResponse.ok ? await runsResponse.json() : { items: [] }
      const budgetPayload = budgetResponse.ok ? await budgetResponse.json() : null
      const alertsPayload = alertsResponse.ok ? await alertsResponse.json() : { items: [] }
      const approvalsPayload = approvalsResponse.ok ? await approvalsResponse.json() : []

      setRuns(Array.isArray(runsPayload?.items) ? runsPayload.items : Array.isArray(runsPayload) ? runsPayload : [])
      setBudget(budgetPayload)
      setAlerts(Array.isArray(alertsPayload?.items) ? alertsPayload.items : [])
      setApprovals(Array.isArray(approvalsPayload) ? approvalsPayload : [])
      setAuthRequired(false)
      if ((Array.isArray(runsPayload?.items) && runsPayload.items.length > 0) || (Array.isArray(alertsPayload?.items) && alertsPayload.items.length > 0)) {
        actions.unlockMilestone('first_monitoring_event_seen')
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load autopilot data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    setThresholdDraft(progress.autopilot.costThresholdPercent)
  }, [progress.autopilot.costThresholdPercent])

  const thresholdBreached = useMemo(() => {
    if (!budget) return false
    return budget.usage_percentage >= progress.autopilot.costThresholdPercent
  }, [budget, progress.autopilot.costThresholdPercent])

  const thresholdValidationError = useMemo(() => {
    if (!Number.isFinite(thresholdDraft)) {
      return 'Enter a threshold between 1 and 100.'
    }

    if (thresholdDraft < 1 || thresholdDraft > 100) {
      return 'Enter a threshold between 1 and 100.'
    }

    return null
  }, [thresholdDraft])

  useEffect(() => {
    if (thresholdBreached && !progress.autopilot.lastThresholdBreachAt) {
      actions.setAutopilot({ lastThresholdBreachAt: new Date().toISOString() })
    }
  }, [actions, progress.autopilot.lastThresholdBreachAt, thresholdBreached])

  const approvalGateEnabled = progress.autopilot.approvalGateEnabled
  const trackedApprovalCount = progress.autopilot.approvalRequestIds.length

  function setApprovalGateEnabled(enabled: boolean) {
    setError(null)
    setReceipt(null)
    actions.setAutopilot({ approvalGateEnabled: enabled })
    if (enabled) {
      actions.unlockMilestone('first_approval_gate_enabled')
    }
  }

  function rememberApprovalRequest(requestId?: string) {
    if (!requestId) return

    actions.setAutopilot({
      approvalGateEnabled: true,
      approvalRequestIds: Array.from(new Set([...progress.autopilot.approvalRequestIds, requestId])),
    })
  }

  async function saveThreshold() {
    if (thresholdValidationError) {
      return
    }

    const nextThreshold = Math.round(thresholdDraft)
    setError(null)
    setThresholdDraft(nextThreshold)
    actions.setAutopilot({ costThresholdPercent: nextThreshold, alertChannel: progress.autopilot.alertChannel })
    actions.unlockMilestone('first_alert_configured')
  }

  async function queueStarterDeploymentApproval() {
    const response = await fetch('/api/pico/approvals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        agent_id: 'pico-autopilot',
        session_id: `pico-${Date.now()}`,
        action_type: 'starter_template_deploy',
        payload: buildStarterApprovalPayload(),
      }),
    })

    const payload = await readJsonSafely(response)

    if (!response.ok) {
      if (response.status === 401) {
        setAuthRequired(true)
      }

      throw new Error(extractErrorMessage(payload, 'Failed to queue starter deployment approval'))
    }

    const approval = payload as ApprovalSummary | null
    rememberApprovalRequest(typeof approval?.id === 'string' ? approval.id : undefined)
    actions.unlockMilestone('first_approval_gate_enabled')
    setReceipt({
      tone: 'queued',
      title: 'Starter deployment queued',
      description:
        typeof approval?.id === 'string'
          ? `Approval ${approval.id} is waiting below.`
          : 'The starter deployment is waiting for human approval.',
    })
    await load()
  }

  async function runStarterDeploymentNow() {
    const response = await fetch(`/api/dashboard/templates/${STARTER_TEMPLATE_ID}/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      cache: 'no-store',
      body: JSON.stringify(STARTER_DEPLOYMENT_REQUEST),
    })

    const payload = await readJsonSafely(response)

    if (!response.ok) {
      if (response.status === 401) {
        setAuthRequired(true)
      }

      throw new Error(extractErrorMessage(payload, 'Failed to deploy starter assistant'))
    }

    const deployPayload = payload as StarterDeploymentResponse | null
    actions.unlockMilestone('successful_deployment')
    setReceipt({
      tone: 'success',
      title: 'Starter assistant deployed',
      description:
        deployPayload?.deployment?.id && deployPayload?.agent?.id
          ? `Deployment ${deployPayload.deployment.id} is live for agent ${deployPayload.agent.id}.`
          : 'The starter assistant was deployed through the real control-plane action.',
    })
    await load()
  }

  async function handleStarterDeployment() {
    setRunningStarterAction(true)
    setError(null)
    setReceipt(null)

    try {
      if (approvalGateEnabled) {
        await queueStarterDeploymentApproval()
      } else {
        await runStarterDeploymentNow()
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to run starter deployment action')
    } finally {
      setRunningStarterAction(false)
    }
  }

  async function resolveApproval(id: string, action: 'approve' | 'reject') {
    setResolvingApprovalId(id)
    setError(null)

    try {
      const response = await fetch(`/api/pico/approvals/${encodeURIComponent(id)}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ comment: `Resolved from Pico ${action} flow` }),
      })

      const payload = await readJsonSafely(response)

      if (!response.ok) {
        if (response.status === 401) {
          setAuthRequired(true)
        }

        throw new Error(extractErrorMessage(payload, `Failed to ${action} request`))
      }

      const approval = payload as ApprovalSummary | null
      const execution = approval?.payload?.execution

      if (action === 'approve') {
        if (execution?.status === 'completed') {
          actions.unlockMilestone('successful_deployment')
          setReceipt({
            tone: 'success',
            title: 'Approved and executed',
            description:
              execution.deployment_id && execution.agent_id
                ? `Starter deployment ${execution.deployment_id} shipped for agent ${execution.agent_id}.`
                : 'The approved action was executed.',
          })
        } else if (execution?.status === 'failed') {
          setReceipt({
            tone: 'warning',
            title: 'Approved, but follow-through failed',
            description: execution.detail ?? 'The request was approved but the real action did not complete.',
          })
        } else {
          setReceipt({
            tone: 'success',
            title: 'Approval recorded',
            description: 'The request left the queue.',
          })
        }
      } else {
        setReceipt({
          tone: 'warning',
          title: 'Request rejected',
          description: 'The queued action will not run.',
        })
      }

      await load()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : `Failed to ${action} request`)
    } finally {
      setResolvingApprovalId(null)
    }
  }

  const receiptClassName = useMemo(() => {
    if (!receipt) return ''
    if (receipt.tone === 'success') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-50'
    if (receipt.tone === 'queued') return 'border-sky-400/20 bg-sky-400/10 text-sky-50'
    return 'border-amber-400/20 bg-amber-400/10 text-amber-50'
  }, [receipt])

  return (
    <PicoShell
      eyebrow="Autopilot bridge"
      title="See the runtime, not just the dream"
      description="Pico reuses real MUTX signals for runs, budget, alerts, and approvals. The only approval-controlled action wired here today is starter deployment. That is enough to make the gate real instead of decorative."
      actions={
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            Refresh live data
          </button>
          <button
            type="button"
            onClick={() => setApprovalGateEnabled(!approvalGateEnabled)}
            className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950"
          >
            {approvalGateEnabled ? 'Turn gate off' : 'Turn gate on'}
          </button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-5 text-sm text-slate-300 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Runs</p>
          <p className="mt-3 text-3xl font-semibold text-white">{runs.length}</p>
          <p className="mt-2">Recent run visibility from the live MUTX run surface.</p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-5 text-sm text-slate-300 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Alerts</p>
          <p className="mt-3 text-3xl font-semibold text-white">{alerts.filter((alert) => !alert.resolved).length}</p>
          <p className="mt-2">Live unresolved alerts plus your Pico threshold check.</p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-5 text-sm text-slate-300 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Budget</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {budget ? formatPercent(budget.usage_percentage) : '--'}
          </p>
          <p className="mt-2">Threshold: {formatPercent(progress.autopilot.costThresholdPercent)}</p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-5 text-sm text-slate-300 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Approvals</p>
          <p className="mt-3 text-3xl font-semibold text-white">{approvals.length}</p>
          <p className="mt-2">Pending risky actions waiting for a human click.</p>
        </div>
      </div>

      {authRequired ? (
        <div className="mt-6 rounded-[28px] border border-amber-400/20 bg-amber-400/10 p-6 text-sm text-amber-50">
          Live autopilot data needs an authenticated MUTX session. The academy still works offline, but live runs, alerts, budgets, and approvals need the real control plane.
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-[28px] border border-rose-400/20 bg-rose-400/10 p-6 text-sm text-rose-50">{error}</div>
      ) : null}

      {receipt ? (
        <div className={`mt-6 rounded-[28px] border p-6 text-sm ${receiptClassName}`}>
          <p className="font-semibold">{receipt.title}</p>
          <p className="mt-2">{receipt.description}</p>
        </div>
      ) : null}

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Approval gate</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Control a real action</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                {approvalGateEnabled ? 'Gate enabled' : 'Gate disabled'}
              </span>
            </div>
            <div className="mt-4 rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
              <p className="font-medium text-white">Starter deployment</p>
              <p className="mt-2">
                This button controls the real <span className="font-mono text-xs text-slate-200">/v1/templates/{STARTER_TEMPLATE_ID}/deploy</span> action.
                With the gate on, Pico writes a pending approval request and waits. With the gate off, the deployment fires immediately.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Deploy payload</p>
                  <p className="mt-2">Name: {STARTER_DEPLOYMENT_REQUEST.name}</p>
                  <p className="mt-1">Workspace: {STARTER_DEPLOYMENT_REQUEST.workspace}</p>
                  <p className="mt-1">Skills: {(STARTER_DEPLOYMENT_REQUEST.skills ?? []).join(', ')}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">What the human controls</p>
                  <p className="mt-2">
                    Approve = create the starter deployment. Reject = nothing runs. Tracked requests: {trackedApprovalCount}.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleStarterDeployment()}
                  disabled={runningStarterAction || authRequired}
                  className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
                >
                  {runningStarterAction
                    ? approvalGateEnabled
                      ? 'Queueing request...'
                      : 'Deploying starter...'
                    : approvalGateEnabled
                      ? 'Queue starter deployment'
                      : 'Deploy starter now'}
                </button>
                <button
                  type="button"
                  onClick={() => setApprovalGateEnabled(!approvalGateEnabled)}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
                >
                  {approvalGateEnabled ? 'Bypass gate for this lane' : 'Require approval for this lane'}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Thresholds</p>
            <div className="mt-4 rounded-[24px] border border-white/10 bg-white/5 p-5">
              <label className="block text-sm text-slate-300">
                <span className="block text-xs uppercase tracking-[0.24em] text-slate-500">Cost threshold percent</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={thresholdDraft}
                  onChange={(event) => {
                    setError(null)
                    setThresholdDraft(Number(event.target.value))
                  }}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] px-4 py-3 text-sm text-slate-100 outline-none"
                />
              </label>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => void saveThreshold()}
                  disabled={Boolean(thresholdValidationError)}
                  className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
                >
                  Save threshold
                </button>
                <select
                  value={progress.autopilot.alertChannel}
                  onChange={(event) => actions.setAutopilot({ alertChannel: event.target.value as 'in_app' | 'email' | 'webhook' })}
                  className="rounded-full border border-white/10 bg-[rgba(3,8,20,0.45)] px-4 py-2 text-sm text-slate-100 outline-none"
                >
                  <option value="in_app">In-app</option>
                  <option value="email">Email-ready</option>
                  <option value="webhook">Webhook-ready</option>
                </select>
              </div>
              {thresholdValidationError ? (
                <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-50">
                  {thresholdValidationError}
                </div>
              ) : null}
              {thresholdBreached ? (
                <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-50">
                  Threshold breached. Live usage is above your configured line in the sand.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Plan matrix</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {Object.entries(PICO_PLAN_MATRIX).map(([plan, features]) => (
                <div key={plan} className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                  <p className="text-lg font-semibold text-white capitalize">{plan}</p>
                  <div className="mt-3 space-y-2">
                    {Object.entries(features).map(([feature, value]) => (
                      <div key={feature}>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{feature.replaceAll('_', ' ')}</p>
                        <p className="mt-1">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Pending approvals</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Human click required</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                {approvals.length} waiting
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-300">
              This queue is not theater. Turn the gate on, trigger starter deployment, then approve or reject the real action here.
            </p>
            <div className="mt-4 space-y-3">
              {approvals.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                  No pending approvals. Turn the gate on and run starter deployment to queue a real request.
                </div>
              ) : (
                approvals.map((approval) => {
                  const starterRequest = approval.payload?.deployment_request
                  const starterExecution = approval.payload?.execution
                  const isStarterDeploy = approval.payload?.kind === 'starter_template_deploy'

                  return (
                    <div key={approval.id} className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{approval.payload?.summary ?? approval.action_type}</p>
                          <p className="mt-1 text-slate-400">Queued {formatTimestamp(approval.created_at)}</p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-[rgba(3,8,20,0.45)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                          {approval.status}
                        </span>
                      </div>
                      <p className="mt-3">Requester: {approval.requester}</p>
                      <p className="mt-1">Agent lane: {approval.agent_id}</p>
                      {isStarterDeploy ? (
                        <div className="mt-3 rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] p-4">
                          <p>Approve will call <span className="font-mono text-xs text-slate-200">/v1/templates/{approval.payload?.template_id ?? STARTER_TEMPLATE_ID}/deploy</span>.</p>
                          <p className="mt-1">Assistant name: {starterRequest?.name ?? 'n/a'}</p>
                          <p className="mt-1">Workspace: {starterRequest?.workspace ?? 'n/a'}</p>
                        </div>
                      ) : null}
                      {starterExecution?.status === 'failed' ? (
                        <div className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-amber-50">
                          Previous execution failed: {starterExecution.detail ?? 'Unknown error'}
                        </div>
                      ) : null}
                      <div className="mt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={() => void resolveApproval(approval.id, 'approve')}
                          disabled={resolvingApprovalId === approval.id}
                          className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
                        >
                          {resolvingApprovalId === approval.id ? 'Working...' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void resolveApproval(approval.id, 'reject')}
                          disabled={resolvingApprovalId === approval.id}
                          className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
                        >
                          {resolvingApprovalId === approval.id ? 'Working...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Live signals</p>
            {loading ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">Loading live MUTX signals...</div>
            ) : (
              <div className="mt-4 space-y-3">
                {runs.slice(0, 3).map((run) => (
                  <div key={run.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    <p className="font-medium text-white">Run {run.id}</p>
                    <p className="mt-1">Status: {run.status}</p>
                    <p className="mt-1">Started: {run.started_at ?? 'n/a'}</p>
                    <Link href="/dashboard/runs" className="mt-3 inline-flex text-sm font-medium text-emerald-200 hover:text-emerald-100">
                      Inspect runs in MUTX dashboard
                    </Link>
                  </div>
                ))}
                {alerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    <p className="font-medium text-white">{alert.type}</p>
                    <p className="mt-1">{alert.message}</p>
                    <Link href="/dashboard/monitoring" className="mt-3 inline-flex text-sm font-medium text-emerald-200 hover:text-emerald-100">
                      Open monitoring
                    </Link>
                  </div>
                ))}
                {budget ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    <p className="font-medium text-white">Budget snapshot</p>
                    <p className="mt-1">Plan: {budget.plan}</p>
                    <p className="mt-1">Used: {budget.credits_used}</p>
                    <p className="mt-1">Remaining: {budget.credits_remaining}</p>
                    <Link href="/dashboard/budgets" className="mt-3 inline-flex text-sm font-medium text-emerald-200 hover:text-emerald-100">
                      Open budgets
                    </Link>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>
    </PicoShell>
  )
}
