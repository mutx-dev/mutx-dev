'use client'

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

type ApprovalSummary = {
  id: string
  action_type: string
  status: string
  requester: string
  created_at: string
  agent_id: string
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`
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
  const [thresholdDraft, setThresholdDraft] = useState(progress.autopilot.costThresholdPercent)

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

  const thresholdBreached = useMemo(() => {
    if (!budget) return false
    return budget.usage_percentage >= progress.autopilot.costThresholdPercent
  }, [budget, progress.autopilot.costThresholdPercent])

  useEffect(() => {
    if (thresholdBreached && !progress.autopilot.lastThresholdBreachAt) {
      actions.setAutopilot({ lastThresholdBreachAt: new Date().toISOString() })
    }
  }, [actions, progress.autopilot.lastThresholdBreachAt, thresholdBreached])

  async function saveThreshold() {
    actions.setAutopilot({ costThresholdPercent: thresholdDraft, alertChannel: progress.autopilot.alertChannel })
    actions.unlockMilestone('first_alert_configured')
  }

  async function createApprovalRequest() {
    const response = await fetch('/api/pico/approvals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        agent_id: 'pico-autopilot',
        session_id: `pico-${Date.now()}`,
        action_type: 'outbound_message_send',
        payload: {
          summary: 'Send an outbound lead reply to an external contact.',
          risk: 'medium',
          source: 'pico-autopilot',
        },
      }),
    })

    if (response.ok) {
      actions.setAutopilot({ approvalGateEnabled: true })
      actions.unlockMilestone('first_approval_gate_enabled')
      await load()
    }
  }

  async function resolveApproval(id: string, action: 'approve' | 'reject') {
    await fetch(`/api/pico/approvals/${id}/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ comment: `Resolved from Pico ${action} flow` }),
    })
    await load()
  }

  return (
    <PicoShell
      eyebrow="Autopilot bridge"
      title="See the runtime, not just the dream"
      description="Pico reuses real MUTX signals for runs, budget, alerts, and approvals. If you are not authenticated yet, the product says so instead of pretending otherwise."
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
            onClick={() => actions.setAutopilot({ approvalGateEnabled: true })}
            className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950"
          >
            Enable gate locally
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

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
        <div className="space-y-6">
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
                  onChange={(event) => setThresholdDraft(Number(event.target.value))}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] px-4 py-3 text-sm text-slate-100 outline-none"
                />
              </label>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => void saveThreshold()}
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
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Approval gate</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Risky action queue</h2>
              </div>
              <button
                type="button"
                onClick={() => void createApprovalRequest()}
                className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                Create sample request
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {approvals.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                  No pending approvals. Good if that is intentional. Bad if you expected a gate and forgot to create one.
                </div>
              ) : (
                approvals.map((approval) => (
                  <div key={approval.id} className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    <p className="font-medium text-white">{approval.action_type}</p>
                    <p className="mt-1">Requester: {approval.requester}</p>
                    <p className="mt-1">Agent: {approval.agent_id}</p>
                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => void resolveApproval(approval.id, 'approve')}
                        className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => void resolveApproval(approval.id, 'reject')}
                        className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
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
                  </div>
                ))}
                {alerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    <p className="font-medium text-white">{alert.type}</p>
                    <p className="mt-1">{alert.message}</p>
                  </div>
                ))}
                {budget ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    <p className="font-medium text-white">Budget snapshot</p>
                    <p className="mt-1">Plan: {budget.plan}</p>
                    <p className="mt-1">Used: {budget.credits_used}</p>
                    <p className="mt-1">Remaining: {budget.credits_remaining}</p>
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
