'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { PicoShell } from '@/components/pico/PicoShell'
import { usePicoProgress } from '@/components/pico/usePicoProgress'
import { usePicoHref } from '@/lib/pico/navigation'
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
    <div className="rounded-[24px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-5 text-sm text-slate-300 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
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
        <span>{formatTimestamp(item.occurredAt)} • {formatRelativeTime(item.occurredAt)}</span>
      </div>
      <h3 className="mt-3 text-base font-semibold text-white">{item.title}</h3>
      <p className="mt-2 text-sm leading-6">{item.detail}</p>
      <p className="mt-3 text-sm leading-6 text-slate-300">Why it matters: {item.impact}</p>
      <Link href={item.href} className="mt-4 inline-flex text-sm font-medium text-emerald-200 hover:text-emerald-100">
        Jump to detail section
      </Link>
    </div>
  )
}

export function PicoAutopilotPageClient() {
  const { progress, derived, actions, syncState } = usePicoProgress()
  const toHref = usePicoHref()
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
  const [creatingApprovalRequest, setCreatingApprovalRequest] = useState(false)

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
      const [runsResponse, budgetResponse, usageResponse, alertsResponse, pendingResponse, approvedResponse, rejectedResponse] = await Promise.all([
        fetch('/api/dashboard/runs?limit=6', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/dashboard/budgets', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/dashboard/budgets/usage?period_start=30d', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/dashboard/monitoring/alerts?limit=8', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/pico/approvals?status=PENDING', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/pico/approvals?status=APPROVED', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/pico/approvals?status=REJECTED', { credentials: 'include', cache: 'no-store' }),
      ])

      const responses = [runsResponse, budgetResponse, usageResponse, alertsResponse, pendingResponse, approvedResponse, rejectedResponse]
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

      const [runsPayload, budgetPayload, usagePayload, alertsPayload, pendingPayload, approvedPayload, rejectedPayload] = await Promise.all(
        responses.map((response) => (response.ok ? readJsonSafely(response) : Promise.resolve(null))),
      )

      const partialFailure = responses.some((response) => !response.ok)
      const nextRuns = Array.isArray((runsPayload as { items?: unknown[] } | null)?.items)
        ? ((runsPayload as { items: AutopilotRunSummary[] }).items ?? [])
        : Array.isArray(runsPayload)
          ? (runsPayload as AutopilotRunSummary[])
          : []
      const nextAlerts = Array.isArray((alertsPayload as { items?: unknown[] } | null)?.items)
        ? ((alertsPayload as { items: AutopilotAlertSummary[] }).items ?? [])
        : []
      const nextApprovals = [...(Array.isArray(pendingPayload) ? (pendingPayload as AutopilotApprovalSummary[]) : []), ...(Array.isArray(approvedPayload) ? (approvedPayload as AutopilotApprovalSummary[]) : []), ...(Array.isArray(rejectedPayload) ? (rejectedPayload as AutopilotApprovalSummary[]) : [])]
        .sort((left, right) => {
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
  const latestRun = runs[0] ?? null
  const primaryAutopilotHref = authRequired || !latestRun
    ? derived.nextLesson
      ? toHref(`/academy/${derived.nextLesson.slug}`)
      : toHref('/academy')
    : '#recent-runs'
  const primaryAutopilotLabel = authRequired || !latestRun
    ? derived.nextLesson
      ? `Finish ${derived.nextLesson.title} first`
      : 'Go back to academy'
    : `Inspect run ${latestRun.id.slice(0, 8)}`

  return (
    <PicoShell
      eyebrow="Autopilot bridge"
      title="Trust the runtime because the surface tells the truth"
      description="First inspect the latest run. Then tighten the threshold. Then decide which risky actions deserve a gate. That is how trust gets earned here."
      actions={
        <Link
          href={primaryAutopilotHref}
          className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
        >
          {primaryAutopilotLabel}
        </Link>
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Runs"
          value={liveValue(String(runs.length))}
          hint={liveHint(
            !integrationStatus.hasLiveAgent
              ? 'No agent is connected to MUTX yet.'
              : runs.length > 0
                ? 'Recent executions pulled from MUTX.'
                : 'An agent exists, but no run has landed yet.',
            'Sign in to read live run history.',
          )}
        />
        <StatCard
          label="Failures"
          value={liveValue(String(failedRuns.length))}
          hint={liveHint(
            failedRuns.length > 0 ? 'Failures are visible here. Good. Hidden failures are worse.' : 'No failed runs in the current window.',
            'Sign in to see failed run count.',
          )}
        />
        <StatCard
          label="Alerts"
          value={liveValue(String(alerts.filter((alert) => !alert.resolved).length))}
          hint={liveHint(
            alerts.some((alert) => !alert.resolved)
              ? 'Unresolved operator pain from the monitoring feed.'
              : integrationStatus.hasRuns
                ? 'No unresolved alerts right now.'
                : 'No alerts yet because nothing has executed.',
            'Sign in to read live alerts.',
          )}
        />
        <StatCard
          label="Budget"
          value={liveValue(budget ? formatPercent(budget.usage_percentage) : '--')}
          hint={liveHint(
            !integrationStatus.hasBudget
              ? 'No live budget snapshot returned yet.'
              : integrationStatus.hasUsage
                ? `${formatPercent(progress.autopilot.costThresholdPercent)} threshold against live spend.`
                : 'Budget exists, but usage is empty in the current window.',
            'Sign in to read budget usage.',
          )}
        />
        <StatCard
          label="Approvals"
          value={liveValue(String(pendingApprovals.length))}
          hint={liveHint(
            pendingApprovals.length > 0
              ? 'Pending risky actions are waiting for a human call.'
              : integrationStatus.hasApprovalRecords && !integrationStatus.approvalGateConfigured
                ? 'Approval history exists, but Pico gate is still off locally.'
                : 'No risky actions are blocked right now.',
            'Sign in to see live approvals.',
          )}
        />
      </div>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-6">
          <div id="timeline-section" className={sectionClasses()}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Activity timeline</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">What happened, when, and why it matters</h2>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                {loadStateLabel}
              </span>
            </div>
            <div className="mt-5 space-y-4">
              {authRequired ? (
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-300">
                  No timeline without live control-plane access. That is the honest answer.
                </div>
              ) : timeline.length === 0 ? (
                <EmptyStatePanel state={runEmptyState} />
              ) : (
                timeline.map((item) => <TimelineItemCard key={item.id} item={item} />)
              )}
            </div>
          </div>

          <div id="recent-runs" className={sectionClasses()}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Runs</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Recent execution history</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Start here. Read the latest run before you touch thresholds or approvals.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
              >
                Refresh live data
              </button>
            </div>
            <div className="mt-5 space-y-4">
              {authRequired ? (
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-300">
                  Sign in, then come back here to inspect the first real run.
                </div>
              ) : runs.length === 0 ? (
                <EmptyStatePanel state={runEmptyState} />
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
                                ? 'This work is still active. Long silence means you may have a stuck runtime.'
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
                      <div className="mt-4 flex flex-wrap gap-4 text-sm">
                        <span className="text-slate-300">Agent: {run.agent_id ?? 'unknown'}</span>
                        <span className="text-slate-300">Trace count: {run.trace_count ?? traces.length}</span>
                        <span className="text-slate-300">
                          {run.started_at ? `Started ${formatTimestamp(run.started_at)}` : 'Start time unavailable'}
                        </span>
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div id="budget-section" className={sectionClasses()}>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Budget</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Live spend and your line in the sand</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Usage</p>
                <p className="mt-3 text-3xl font-semibold text-white">{authRequired ? '--' : budget ? formatPercent(budget.usage_percentage) : '--'}</p>
                <p className="mt-2">
                  {authRequired
                    ? 'Live budget requires authentication.'
                    : budget
                      ? `${budget.credits_used} used of ${budget.credits_total}. Reset ${budget.reset_date ? formatTimestamp(budget.reset_date) : 'unknown'}.`
                      : 'No live budget snapshot returned.'}
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Threshold</p>
                <p className="mt-3 text-3xl font-semibold text-white">{formatPercent(progress.autopilot.costThresholdPercent)}</p>
                <p className="mt-2">Stored through Pico progress sync: {syncState}</p>
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
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Pico stores the threshold here. Actual alert delivery still follows the real MUTX monitoring setup, so this surface does not pretend email or webhook routing is active when it is not.
              </p>
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

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
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
                    <EmptyStatePanel state={usageEmptyState} />
                  )}
                </div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
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
                    <EmptyStatePanel state={usageEmptyState} />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div id="alerts-section" className={sectionClasses()}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Alerts</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Meaningful monitoring events</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  This is the live alert feed. No fake warning badges, no synthetic incidents.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {authRequired ? (
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-300">
                  Sign in to load live alerts.
                </div>
              ) : alerts.length === 0 ? (
                <EmptyStatePanel state={alertsEmptyState} />
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
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-300">
                      <span>Agent: {alert.agent_id}</span>
                      <span>{alert.resolved ? 'Resolved' : 'Still active'}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">Why it matters: {explainAlertImpact(alert)}</p>
                  </article>
                ))
              )}
            </div>
          </div>

          <div id="approvals-section" className={sectionClasses()}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Approvals</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Risky actions and their decisions</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  This queue is now the approval source of truth for Pico. It should not disappear because a process restarted.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {authRequired ? (
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-300">
                  Sign in to load live approval requests.
                </div>
              ) : pendingApprovals.length === 0 && resolvedApprovals.length === 0 ? (
                <EmptyStatePanel state={approvalsEmptyState} />
              ) : (
                <>
                  {integrationStatus.hasApprovalRecords && !integrationStatus.approvalGateConfigured ? (
                    <div className="rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-5 text-sm leading-6 text-amber-50">
                      Approval records already exist in MUTX, but Pico still shows the gate as off locally. Turn on the gate here so the product state matches the control-plane reality.
                    </div>
                  ) : null}
                  {pendingApprovals.map((approval) => (
                    <article key={approval.id} className={`rounded-[24px] border p-5 ${severityClasses('warn')}`}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em]">Pending</p>
                          <h3 className="mt-2 text-lg font-semibold text-white">{approval.action_type}</h3>
                        </div>
                        <div className="text-right text-xs uppercase tracking-[0.18em] text-slate-300">
                          <p>{formatTimestamp(approval.created_at)}</p>
                          <p className="mt-1">{formatRelativeTime(approval.created_at)}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-6">
                        {typeof approval.payload?.summary === 'string'
                          ? approval.payload.summary
                          : `${approval.requester} requested this action for agent ${approval.agent_id}.`}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-300">Why it matters: {explainApprovalImpact(approval)}</p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => void resolveApproval(approval.id, 'approve')}
                          disabled={resolvingApprovalId === approval.id}
                          className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {resolvingApprovalId === approval.id ? 'Working...' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void resolveApproval(approval.id, 'reject')}
                          disabled={resolvingApprovalId === approval.id}
                          className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {resolvingApprovalId === approval.id ? 'Working...' : 'Reject'}
                        </button>
                      </div>
                    </article>
                  ))}

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
                      <p className="mt-4 text-sm leading-6">
                        {typeof approval.payload?.summary === 'string'
                          ? approval.payload.summary
                          : `${approval.requester} requested this action for agent ${approval.agent_id}.`}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-300">
                        <span>Agent: {approval.agent_id}</span>
                        <span>Requester: {approval.requester}</span>
                        <span>Approver: {approval.approver ?? 'unknown'}</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-300">Why it matters: {explainApprovalImpact(approval)}</p>
                    </article>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </PicoShell>
  )
}
