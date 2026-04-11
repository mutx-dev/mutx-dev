'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { PicoDisclosure, PicoNowNext } from '@/components/pico/PicoSimpleFlow'
import { PicoShell } from '@/components/pico/PicoShell'
import { usePicoProgress } from '@/components/pico/usePicoProgress'
import {
  buildAutopilotTimeline,
  describeRunDetail,
  explainAlertImpact,
  explainApprovalImpact,
  formatPercent,
  formatRelativeTime,
  formatTimestamp,
  getRunSeverity,
  humanizeRunStatus,
  type AutopilotAlertSummary,
  type AutopilotApprovalSummary,
  type AutopilotBudgetSummary,
  type AutopilotRunSummary,
  type AutopilotRunTrace,
  type AutopilotTimelineItem,
  type AutopilotUsageBreakdown,
} from '@/components/pico/picoAutopilot'

type LoadState = 'loading' | 'ready' | 'partial' | 'offline'

type FocusAction =
  | 'runs'
  | 'monitoring'
  | 'approvals'
  | 'threshold'
  | 'refresh'
  | 'dashboard'
  | 'enable-gate'
  | 'none'

type FocusState = {
  title: string
  body: string
  action: FocusAction
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

function severityClasses(severity: AutopilotTimelineItem['severity']) {
  switch (severity) {
    case 'critical':
      return 'border-rose-400/20 bg-rose-400/10 text-rose-50'
    case 'warn':
      return 'border-amber-400/20 bg-amber-400/10 text-amber-50'
    case 'good':
      return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-50'
    default:
      return 'border-white/10 bg-white/5 text-slate-200'
  }
}

function sectionClasses() {
  return 'rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]'
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2">{hint}</p>
    </div>
  )
}

function TimelineItemCard({ item }: { item: AutopilotTimelineItem }) {
  return (
    <div className={`rounded-[24px] border p-5 ${severityClasses(item.severity)}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.18em]">
        <span>{item.sourceLabel}</span>
        <span>
          {formatTimestamp(item.occurredAt)} • {formatRelativeTime(item.occurredAt)}
        </span>
      </div>
      <h3 className="mt-3 text-base font-semibold text-white">{item.title}</h3>
      <p className="mt-2 text-sm leading-6">{item.detail}</p>
      <p className="mt-3 text-sm leading-6 text-slate-300">Why it matters: {item.impact}</p>
      <Link href={item.href} className="mt-4 inline-flex text-sm font-medium text-emerald-200 hover:text-emerald-100">
        Open source view
      </Link>
    </div>
  )
}

function approvalSummary(approval: AutopilotApprovalSummary) {
  return typeof approval.payload?.summary === 'string'
    ? approval.payload.summary
    : `${approval.requester} requested this action for agent ${approval.agent_id}.`
}

export function PicoAutopilotPageClient() {
  const { progress, actions, syncState } = usePicoProgress()
  const [runs, setRuns] = useState<AutopilotRunSummary[]>([])
  const [tracesByRunId, setTracesByRunId] = useState<Record<string, AutopilotRunTrace[]>>({})
  const [budget, setBudget] = useState<AutopilotBudgetSummary | null>(null)
  const [usage, setUsage] = useState<AutopilotUsageBreakdown | null>(null)
  const [alerts, setAlerts] = useState<AutopilotAlertSummary[]>([])
  const [approvals, setApprovals] = useState<AutopilotApprovalSummary[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [authRequired, setAuthRequired] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [thresholdDraft, setThresholdDraft] = useState(progress.autopilot.costThresholdPercent)
  const [resolvingApprovalId, setResolvingApprovalId] = useState<string | null>(null)

  const pendingApprovals = useMemo(
    () => approvals.filter((approval) => approval.status === 'PENDING'),
    [approvals],
  )

  const resolvedApprovals = useMemo(
    () => approvals.filter((approval) => approval.status !== 'PENDING').slice(0, 4),
    [approvals],
  )

  async function load() {
    setLoadState('loading')
    setError(null)

    try {
      const [
        runsResponse,
        budgetResponse,
        usageResponse,
        alertsResponse,
        pendingResponse,
        approvedResponse,
        rejectedResponse,
      ] = await Promise.all([
        fetch('/api/dashboard/runs?limit=6', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/dashboard/budgets', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/dashboard/budgets/usage?period_start=30d', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/dashboard/monitoring/alerts?limit=8', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/pico/approvals?status=PENDING', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/pico/approvals?status=APPROVED', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/pico/approvals?status=REJECTED', { credentials: 'include', cache: 'no-store' }),
      ])

      const responses = [
        runsResponse,
        budgetResponse,
        usageResponse,
        alertsResponse,
        pendingResponse,
        approvedResponse,
        rejectedResponse,
      ]
      if (responses.some((response) => response.status === 401)) {
        setAuthRequired(true)
        setRuns([])
        setTracesByRunId({})
        setBudget(null)
        setUsage(null)
        setAlerts([])
        setApprovals([])
        setLoadState('offline')
        return
      }

      const [
        runsPayload,
        budgetPayload,
        usagePayload,
        alertsPayload,
        pendingPayload,
        approvedPayload,
        rejectedPayload,
      ] = await Promise.all(responses.map((response) => (response.ok ? readJsonSafely(response) : Promise.resolve(null))))

      const partialFailure = responses.some((response) => !response.ok)
      const nextRuns = Array.isArray((runsPayload as { items?: unknown[] } | null)?.items)
        ? ((runsPayload as { items: AutopilotRunSummary[] }).items ?? [])
        : Array.isArray(runsPayload)
          ? (runsPayload as AutopilotRunSummary[])
          : []
      const nextAlerts = Array.isArray((alertsPayload as { items?: unknown[] } | null)?.items)
        ? ((alertsPayload as { items: AutopilotAlertSummary[] }).items ?? [])
        : []
      const nextApprovals = [
        ...(Array.isArray(pendingPayload) ? (pendingPayload as AutopilotApprovalSummary[]) : []),
        ...(Array.isArray(approvedPayload) ? (approvedPayload as AutopilotApprovalSummary[]) : []),
        ...(Array.isArray(rejectedPayload) ? (rejectedPayload as AutopilotApprovalSummary[]) : []),
      ].sort((left, right) => {
        const leftTime = new Date(left.resolved_at ?? left.created_at).getTime()
        const rightTime = new Date(right.resolved_at ?? right.created_at).getTime()
        return rightTime - leftTime
      })

      setRuns(nextRuns)
      setBudget((budgetPayload as AutopilotBudgetSummary | null) ?? null)
      setUsage((usagePayload as AutopilotUsageBreakdown | null) ?? null)
      setAlerts(nextAlerts)
      setApprovals(nextApprovals)
      setAuthRequired(false)
      setLoadState(partialFailure ? 'partial' : 'ready')

      if (nextRuns.length > 0 || nextAlerts.length > 0) {
        actions.unlockMilestone('first_monitoring_event_seen')
      }

      const tracePairs = await Promise.all(
        nextRuns.slice(0, 4).map(async (run) => {
          try {
            const response = await fetch(`/api/dashboard/runs/${encodeURIComponent(run.id)}/traces?limit=6`, {
              credentials: 'include',
              cache: 'no-store',
            })

            if (!response.ok) {
              return [run.id, []] as const
            }

            const payload = (await readJsonSafely(response)) as { items?: AutopilotRunTrace[] } | null
            return [run.id, Array.isArray(payload?.items) ? payload.items : []] as const
          } catch {
            return [run.id, []] as const
          }
        }),
      )

      setTracesByRunId(Object.fromEntries(tracePairs))

      if (partialFailure) {
        setError('Some live MUTX signals failed to load. What is shown is partial, not fabricated.')
      }
    } catch (loadError) {
      setLoadState('partial')
      setError(loadError instanceof Error ? loadError.message : 'Failed to load live autopilot data')
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

  const failedRuns = useMemo(
    () => runs.filter((run) => ['FAILED', 'ERROR', 'CANCELLED'].includes(run.status.toUpperCase())),
    [runs],
  )

  const timeline = useMemo(
    () =>
      buildAutopilotTimeline({
        runs,
        alerts,
        approvals: approvals.slice(0, 8),
        budget,
        thresholdPercent: progress.autopilot.costThresholdPercent,
        tracesByRunId,
      }).slice(0, 10),
    [alerts, approvals, budget, progress.autopilot.costThresholdPercent, runs, tracesByRunId],
  )

  const unresolvedAlerts = useMemo(() => alerts.filter((alert) => !alert.resolved), [alerts])
  const leadApproval = pendingApprovals[0] ?? null
  const leadAlert = unresolvedAlerts[0] ?? null
  const leadFailure = failedRuns[0] ?? null
  const latestRun = runs[0] ?? null
  const hasLiveSignals = Boolean(runs.length || alerts.length || approvals.length || budget || usage)

  function saveThreshold() {
    if (thresholdValidationError) {
      return
    }

    const nextThreshold = Math.round(thresholdDraft)
    setThresholdDraft(nextThreshold)
    actions.setAutopilot({
      costThresholdPercent: nextThreshold,
      alertChannel: progress.autopilot.alertChannel,
    })
    actions.unlockMilestone('first_alert_configured')
  }

  function enableApprovalGate() {
    actions.setAutopilot({ approvalGateEnabled: true })
    actions.unlockMilestone('first_approval_gate_enabled')
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
          setLoadState('offline')
        }

        throw new Error(extractErrorMessage(payload, `Failed to ${action} request`))
      }

      await load()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : `Failed to ${action} request`)
    } finally {
      setResolvingApprovalId(null)
    }
  }

  const liveValue = (value: string) => (authRequired ? '--' : value)
  const liveHint = (readyHint: string, offlineHint: string) => (authRequired ? offlineHint : readyHint)

  const currentFocus = useMemo<FocusState>(() => {
    if (authRequired) {
      return {
        title: 'Sign in to unlock live runtime truth',
        body: 'No honest run, alert, budget, or approval feed exists until your MUTX session is authenticated.',
        action: 'dashboard',
      }
    }

    if (thresholdBreached && budget) {
      return {
        title: 'Budget line crossed',
        body: `Live usage is ${formatPercent(budget.usage_percentage)} against your ${formatPercent(progress.autopilot.costThresholdPercent)} threshold. Fix the line in the sand before spend surprises you again.`,
        action: 'threshold',
      }
    }

    if (leadApproval) {
      return {
        title: `${leadApproval.action_type} is waiting on a human call`,
        body: approvalSummary(leadApproval),
        action: 'approvals',
      }
    }

    if (leadAlert) {
      return {
        title: 'A live alert needs attention',
        body: `${leadAlert.message} ${explainAlertImpact(leadAlert)}`,
        action: 'monitoring',
      }
    }

    if (leadFailure) {
      return {
        title: `Recent run ${leadFailure.id.slice(0, 8)} failed`,
        body: describeRunDetail(leadFailure, tracesByRunId[leadFailure.id] ?? []),
        action: 'runs',
      }
    }

    if (latestRun) {
      return {
        title: `Runtime visible: ${humanizeRunStatus(latestRun.status)}`,
        body: describeRunDetail(latestRun, tracesByRunId[latestRun.id] ?? []),
        action: 'runs',
      }
    }

    return {
      title: 'No live signals yet',
      body: hasLiveSignals
        ? 'Some control-plane data exists, but nothing urgent is leading the feed.'
        : 'Either nothing ran yet or the control plane has no signals for this account.',
      action: 'refresh',
    }
  }, [
    authRequired,
    budget,
    hasLiveSignals,
    latestRun,
    leadAlert,
    leadApproval,
    leadFailure,
    progress.autopilot.costThresholdPercent,
    thresholdBreached,
    tracesByRunId,
  ])

  const nextFocus = useMemo<FocusState>(() => {
    if (authRequired) {
      return {
        title: 'Next: get into the control plane',
        body: 'Once signed in, Pico can show real runs, live alerts, spend, and approval decisions instead of a blank shell.',
        action: 'dashboard',
      }
    }

    if (!progress.autopilot.approvalGateEnabled) {
      return {
        title: 'Next: turn on the approval gate',
        body: 'Keep risky outbound actions waiting for a human instead of trusting vibes.',
        action: 'enable-gate',
      }
    }

    if (pendingApprovals.length > 0) {
      return {
        title: 'Next: clear the risky-action queue',
        body: `${pendingApprovals.length} pending approval${pendingApprovals.length === 1 ? '' : 's'} should not sit around unowned.`,
        action: 'approvals',
      }
    }

    return {
      title: 'Next: keep controls honest',
      body: `Threshold is ${formatPercent(progress.autopilot.costThresholdPercent)} and alerts route to ${progress.autopilot.alertChannel.replace('_', ' ')}. Tune that before the next surprise bill or bad send.`,
      action: 'threshold',
    }
  }, [authRequired, pendingApprovals.length, progress.autopilot.alertChannel, progress.autopilot.approvalGateEnabled, progress.autopilot.costThresholdPercent])

  function renderFocusAction(action: FocusAction) {
    switch (action) {
      case 'runs':
        return (
          <Link href="/dashboard/runs" className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200">
            Open run history
          </Link>
        )
      case 'monitoring':
        return (
          <Link href="/dashboard/monitoring" className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200">
            Open monitoring
          </Link>
        )
      case 'dashboard':
        return (
          <Link href="/dashboard" className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200">
            Open MUTX dashboard
          </Link>
        )
      case 'threshold':
        return (
          <a href="#pico-autopilot-controls" className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200">
            Tune controls
          </a>
        )
      case 'refresh':
        return (
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
          >
            Refresh live data
          </button>
        )
      case 'enable-gate':
        return (
          <button
            type="button"
            onClick={enableApprovalGate}
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
          >
            Enable approval gate
          </button>
        )
      case 'approvals':
        if (!leadApproval) {
          return (
            <Link href="/dashboard/approvals" className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200">
              Open approvals
            </Link>
          )
        }

        return (
          <>
            <button
              type="button"
              onClick={() => void resolveApproval(leadApproval.id, 'approve')}
              disabled={resolvingApprovalId === leadApproval.id}
              className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resolvingApprovalId === leadApproval.id ? 'Working...' : 'Approve'}
            </button>
            <button
              type="button"
              onClick={() => void resolveApproval(leadApproval.id, 'reject')}
              disabled={resolvingApprovalId === leadApproval.id}
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resolvingApprovalId === leadApproval.id ? 'Working...' : 'Reject'}
            </button>
          </>
        )
      default:
        return null
    }
  }

  return (
    <PicoShell
      eyebrow="Autopilot bridge"
      title="Keep the control loop obvious"
      description="Autopilot should surface the one thing that matters now, the one thing to do next, and hide the noisy feeds until you ask for them."
      actions={
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
        >
          Refresh live data
        </button>
      }
    >
      {authRequired ? (
        <div className="mb-6 rounded-[28px] border border-amber-400/20 bg-amber-400/10 p-6 text-sm leading-6 text-amber-50">
          Live Autopilot needs an authenticated MUTX session. Until then, there is no honest run, alert, budget, or approval feed to show you.
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 rounded-[28px] border border-rose-400/20 bg-rose-400/10 p-6 text-sm leading-6 text-rose-50">
          {error}
        </div>
      ) : null}

      <PicoNowNext
        current={{
          label: 'Current step',
          title: currentFocus.title,
          body: currentFocus.body,
          actions: renderFocusAction(currentFocus.action),
        }}
        next={{
          label: 'Next step',
          title: nextFocus.title,
          body: nextFocus.body,
          actions: renderFocusAction(nextFocus.action),
        }}
      />

      <section id="pico-autopilot-controls" className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className={sectionClasses()}>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Control 01</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Cost threshold</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Keep the threshold visible and editable. The detailed spend breakdown can stay folded away.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Live usage</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {authRequired ? '--' : budget ? formatPercent(budget.usage_percentage) : '--'}
              </p>
              <p className="mt-2">
                {authRequired
                  ? 'Live budget requires authentication.'
                  : budget
                    ? `${budget.credits_used} used of ${budget.credits_total}.`
                    : 'No live budget snapshot returned.'}
              </p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Stored limit</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {formatPercent(progress.autopilot.costThresholdPercent)}
              </p>
              <p className="mt-2">Progress sync: {syncState}</p>
            </div>
          </div>
          <div className="mt-5 rounded-[24px] border border-white/10 bg-[rgba(3,8,20,0.45)] p-5">
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
                className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none"
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={saveThreshold}
                disabled={Boolean(thresholdValidationError)}
                className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save threshold
              </button>
              <select
                value={progress.autopilot.alertChannel}
                onChange={(event) =>
                  actions.setAutopilot({
                    alertChannel: event.target.value as 'in_app' | 'email' | 'webhook',
                  })
                }
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 outline-none"
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
                Threshold breached. Live usage is above the limit you configured.
              </div>
            ) : null}
          </div>
        </div>

        <div className={sectionClasses()}>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Control 02</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Approval gate</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Keep risky actions behind a human decision. Show the queue. Hide the historical sludge unless someone asks.
          </p>
          <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {progress.autopilot.approvalGateEnabled ? 'Enabled' : 'Off'}
            </p>
            <p className="mt-2">
              {progress.autopilot.approvalGateEnabled
                ? 'Risky actions can pause for a human decision.'
                : 'Turn this on before you trust outbound sends.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {progress.autopilot.approvalGateEnabled ? (
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-emerald-100">
                  Gate ready
                </span>
              ) : (
                <button
                  type="button"
                  onClick={enableApprovalGate}
                  className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
                >
                  Enable approval gate
                </button>
              )}
              <Link href="/dashboard/approvals" className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200">
                Open approvals
              </Link>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-white/10 bg-[rgba(3,8,20,0.45)] p-5 text-sm text-slate-300">
            <p className="font-medium text-white">Pending queue</p>
            {leadApproval ? (
              <div className="mt-3 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{leadApproval.action_type}</p>
                  <p className="mt-2">{approvalSummary(leadApproval)}</p>
                  <p className="mt-3 text-slate-400">Why it matters: {explainApprovalImpact(leadApproval)}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void resolveApproval(leadApproval.id, 'approve')}
                    disabled={resolvingApprovalId === leadApproval.id}
                    className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resolvingApprovalId === leadApproval.id ? 'Working...' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void resolveApproval(leadApproval.id, 'reject')}
                    disabled={resolvingApprovalId === leadApproval.id}
                    className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resolvingApprovalId === leadApproval.id ? 'Working...' : 'Reject'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-3">No pending approvals are waiting right now.</p>
            )}
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <PicoDisclosure title="Show live summary" hint="Quick counts if you want them, folded away when you do not.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Runs"
              value={liveValue(String(runs.length))}
              hint={liveHint(
                runs.length > 0 ? 'Recent executions pulled from MUTX.' : 'No runs recorded yet.',
                'Sign in to read live run history.',
              )}
            />
            <StatCard
              label="Failures"
              value={liveValue(String(failedRuns.length))}
              hint={liveHint(
                failedRuns.length > 0 ? 'Failures are visible. Good. Hidden failures are worse.' : 'No failed runs in the current window.',
                'Sign in to see failed run count.',
              )}
            />
            <StatCard
              label="Alerts"
              value={liveValue(String(unresolvedAlerts.length))}
              hint={liveHint(
                unresolvedAlerts.length > 0 ? 'Unresolved operator pain from the monitoring feed.' : 'No unresolved alerts right now.',
                'Sign in to read live alerts.',
              )}
            />
            <StatCard
              label="Budget"
              value={liveValue(budget ? formatPercent(budget.usage_percentage) : '--')}
              hint={liveHint(
                budget ? `${formatPercent(progress.autopilot.costThresholdPercent)} threshold against live spend.` : 'No live budget snapshot returned yet.',
                'Sign in to read budget usage.',
              )}
            />
            <StatCard
              label="Approvals"
              value={liveValue(String(pendingApprovals.length))}
              hint={liveHint(
                pendingApprovals.length > 0 ? 'Pending risky actions are waiting for a human call.' : 'No risky actions are blocked right now.',
                'Sign in to see live approvals.',
              )}
            />
            <StatCard
              label="Load"
              value={loadState}
              hint={authRequired ? 'Autopilot is offline until you sign in.' : 'Live fetch status for this surface.'}
            />
          </div>
        </PicoDisclosure>

        <PicoDisclosure title="Show activity timeline" hint="Timeline, logs, and extra context live here when you actually need them.">
          <div className="space-y-4">
            {authRequired ? (
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-300">
                No timeline without live control-plane access. That is the honest answer.
              </div>
            ) : timeline.length === 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-300">
                No activity is visible yet. Either nothing ran or the control plane has not recorded signals for this account.
              </div>
            ) : (
              timeline.map((item) => <TimelineItemCard key={item.id} item={item} />)
            )}
          </div>
        </PicoDisclosure>

        <PicoDisclosure title="Show recent runs" hint="Execution history and traces are useful, but they should not bury the next action.">
          <div className="space-y-4">
            {authRequired ? (
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-300">
                Sign in to load recent runs and traces.
              </div>
            ) : runs.length === 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-300">
                No runs returned from MUTX yet.
              </div>
            ) : (
              runs.map((run) => {
                const severity = getRunSeverity(run.status)
                const traces = tracesByRunId[run.id] ?? []
                return (
                  <article key={run.id} className={`rounded-[24px] border p-5 ${severityClasses(severity)}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em]">{humanizeRunStatus(run.status)}</p>
                        <h3 className="mt-2 text-lg font-semibold text-white">Run {run.id.slice(0, 8)}</h3>
                      </div>
                      <div className="text-right text-xs uppercase tracking-[0.18em] text-slate-300">
                        <p>{formatTimestamp(run.completed_at ?? run.started_at ?? run.created_at)}</p>
                        <p className="mt-1">{formatRelativeTime(run.completed_at ?? run.started_at ?? run.created_at)}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6">{describeRunDetail(run, traces)}</p>
                    <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] p-4">
                        <p className="font-medium text-white">Why it matters</p>
                        <p className="mt-2">
                          {['FAILED', 'ERROR', 'CANCELLED'].includes(run.status.toUpperCase())
                            ? 'This job failed. If the agent is still trusted, it should be because you understand this failure.'
                            : ['RUNNING', 'QUEUED', 'PENDING'].includes(run.status.toUpperCase())
                              ? 'This work is still active. Long silence usually means you should check the runtime.'
                              : 'The job finished. Now verify the output is useful, not just technically complete.'}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] p-4">
                        <p className="font-medium text-white">Trace signals</p>
                        {traces.length === 0 ? (
                          <p className="mt-2">No run traces were returned for this run.</p>
                        ) : (
                          <div className="mt-2 space-y-2">
                            {[...traces].slice(-3).reverse().map((trace) => (
                              <div key={`${trace.run_id}-${trace.sequence ?? trace.timestamp ?? trace.event_type}`} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{trace.event_type}</p>
                                <p className="mt-1">{trace.message}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })
            )}
          </div>
        </PicoDisclosure>

        <PicoDisclosure title="Show budget breakdown" hint="Spend detail stays here until someone needs the breakdown.">
          <div className="space-y-4 text-sm text-slate-300">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="font-medium text-white">Usage snapshot</p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {authRequired ? '--' : budget ? formatPercent(budget.usage_percentage) : '--'}
                </p>
                <p className="mt-2">
                  {authRequired
                    ? 'Live budget requires authentication.'
                    : budget
                      ? `${budget.credits_used} used of ${budget.credits_total}. Reset ${budget.reset_date ? formatTimestamp(budget.reset_date) : 'unknown'}.`
                      : 'No live budget snapshot returned.'}
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="font-medium text-white">Top spenders</p>
                <div className="mt-3 space-y-2">
                  {authRequired ? (
                    <p>Sign in to read the usage breakdown.</p>
                  ) : usage?.usage_by_agent.length ? (
                    usage.usage_by_agent.slice(0, 3).map((item) => (
                      <div key={`${item.agent_id}-${item.agent_name}`} className="rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] px-4 py-3">
                        <p className="font-medium text-white">{item.agent_name}</p>
                        <p className="mt-1">{item.credits_used} credits across {item.event_count} events</p>
                      </div>
                    ))
                  ) : (
                    <p>No agent-level usage returned for the last 30 days.</p>
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="font-medium text-white">Usage drivers</p>
              <div className="mt-3 space-y-2">
                {authRequired ? (
                  <p>Sign in to read the usage breakdown.</p>
                ) : usage?.usage_by_type.length ? (
                  usage.usage_by_type.slice(0, 3).map((item) => (
                    <div key={item.event_type} className="rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] px-4 py-3">
                      <p className="font-medium text-white">{item.event_type}</p>
                      <p className="mt-1">{item.credits_used} credits across {item.event_count} events</p>
                    </div>
                  ))
                ) : (
                  <p>No usage event breakdown returned for the last 30 days.</p>
                )}
              </div>
            </div>
          </div>
        </PicoDisclosure>

        <PicoDisclosure title="Show alerts" hint="Live monitoring events, folded until you need the list.">
          <div className="space-y-4">
            {authRequired ? (
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-300">
                Sign in to load live alerts.
              </div>
            ) : alerts.length === 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-300">
                No alerts returned from MUTX right now.
              </div>
            ) : (
              alerts.map((alert) => (
                <article key={alert.id} className={`rounded-[24px] border p-5 ${severityClasses(alert.resolved ? 'good' : 'critical')}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em]">{alert.type}</p>
                      <h3 className="mt-2 text-lg font-semibold text-white">{alert.resolved ? 'Resolved alert' : 'Active alert'}</h3>
                    </div>
                    <div className="text-right text-xs uppercase tracking-[0.18em] text-slate-300">
                      <p>{formatTimestamp(alert.resolved_at ?? alert.created_at)}</p>
                      <p className="mt-1">{formatRelativeTime(alert.resolved_at ?? alert.created_at)}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6">{alert.message}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">Why it matters: {explainAlertImpact(alert)}</p>
                </article>
              ))
            )}
          </div>
        </PicoDisclosure>

        <PicoDisclosure title="Show approval history" hint="Pending work stays on the main surface. History lives here.">
          <div className="space-y-4">
            {authRequired ? (
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-300">
                Sign in to load live approval requests.
              </div>
            ) : pendingApprovals.length === 0 && resolvedApprovals.length === 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-300">
                No approval events were returned from MUTX.
              </div>
            ) : (
              <>
                {resolvedApprovals.map((approval) => (
                  <article key={approval.id} className={`rounded-[24px] border p-5 ${severityClasses(approval.status === 'APPROVED' ? 'good' : 'critical')}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em]">{approval.status}</p>
                        <h3 className="mt-2 text-lg font-semibold text-white">{approval.action_type}</h3>
                      </div>
                      <div className="text-right text-xs uppercase tracking-[0.18em] text-slate-300">
                        <p>{formatTimestamp(approval.resolved_at ?? approval.created_at)}</p>
                        <p className="mt-1">{formatRelativeTime(approval.resolved_at ?? approval.created_at)}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6">{approvalSummary(approval)}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-300">Why it matters: {explainApprovalImpact(approval)}</p>
                  </article>
                ))}
              </>
            )}
          </div>
        </PicoDisclosure>
      </div>
    </PicoShell>
  )
}
