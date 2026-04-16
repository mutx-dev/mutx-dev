'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'

import { PicoSessionBanner } from '@/components/pico/PicoSessionBanner'
import { PicoShell } from '@/components/pico/PicoShell'
import { PicoSurfaceCompass } from '@/components/pico/PicoSurfaceCompass'
import { picoClasses, picoEmber, picoInset, picoPanel, picoSoft } from '@/components/pico/picoTheme'
import { usePicoLessonWorkspace } from '@/components/pico/usePicoLessonWorkspace'
import { usePicoProgress } from '@/components/pico/usePicoProgress'
import { usePicoSession } from '@/components/pico/usePicoSession'
import { picoRobotAutopilotHighlights } from '@/lib/picoRobotArt'
import { usePicoHref } from '@/lib/pico/navigation'
import { cn } from '@/lib/utils'
import {
  analyzeAutopilotIntegration,
  buildAutopilotTimeline,
  describeRunDetail,
  explainAlertImpact,
  explainApprovalImpact,
  formatPercent,
  formatRelativeTime,
  formatTimestamp,
  getAlertsEmptyState,
  getApprovalsEmptyState,
  getRunsEmptyState,
  getRunSeverity,
  getUsageEmptyState,
  humanizeRunStatus,
  type AutopilotAlertSummary,
  type AutopilotApprovalSummary,
  type AutopilotBudgetSummary,
  type AutopilotEmptyState,
  type AutopilotRunSummary,
  type AutopilotRunTrace,
  type AutopilotTimelineItem,
  type AutopilotUsageBreakdown,
} from '@/components/pico/picoAutopilot'

type LoadState = 'loading' | 'ready' | 'partial' | 'offline'

const controlProtocol = [
  {
    id: '01',
    title: 'Start with the last run',
    body: 'If the latest execution does not make sense, the rest of this surface is just decoration.',
    href: '#recent-runs',
    action: 'Open recent runs',
  },
  {
    id: '02',
    title: 'Budget tells you when to stop',
    body: 'Thresholds are useful only when they are anchored to live spend rather than gut feel.',
    href: '#budget-section',
    action: 'Tune spend guardrail',
  },
  {
    id: '03',
    title: 'Risky actions stay visible',
    body: 'Approvals should survive restarts, stay reviewable, and read like real decisions.',
    href: '#approvals-section',
    action: 'Open approval queue',
  },
] as const

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

export function isUnauthorizedPayload(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return false
  }

  const candidate = payload as {
    status?: unknown
    error?: unknown
  }

  if (candidate.status === 'error' && candidate.error && typeof candidate.error === 'object') {
    const error = candidate.error as { code?: unknown }
    return error.code === 'UNAUTHORIZED'
  }

  return false
}

function severityClasses(severity: AutopilotTimelineItem['severity']) {
  switch (severity) {
    case 'critical':
      return 'border-rose-400/20 bg-rose-400/10 text-rose-50'
    case 'warn':
      return 'border-amber-400/20 bg-amber-400/10 text-amber-50'
    case 'good':
      return 'border-[color:var(--pico-border-hover)] bg-[linear-gradient(180deg,rgba(var(--pico-accent-rgb),0.16),rgba(8,15,9,0.2))] text-[color:var(--pico-text)]'
    default:
      return 'border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] text-[color:var(--pico-text-secondary)]'
  }
}

function sectionClasses() {
  return picoPanel('p-6')
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className={picoClasses.metric}>
      <p className={picoClasses.label}>{label}</p>
      <p className={picoClasses.metricValue}>{value}</p>
      <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">{hint}</p>
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
      <h3 className="mt-3 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">{item.title}</h3>
      <p className="mt-2 text-sm leading-6">{item.detail}</p>
      <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">Why it matters: {item.impact}</p>
      <Link href={item.href} className={cn(picoClasses.link, 'mt-4 inline-flex')}>
        Jump to detail section
      </Link>
    </div>
  )
}

function EmptyStatePanel({ state }: { state: AutopilotEmptyState }) {
  return (
    <div className={picoSoft('p-5')}>
      <p className="font-medium text-[color:var(--pico-text)]">{state.title}</p>
      <p className="mt-2">{state.body}</p>
      <Link
        href={state.nextStep.href}
        className={cn(picoClasses.secondaryButton, 'mt-4')}
      >
        {state.nextStep.label}
      </Link>
    </div>
  )
}

export function PicoAutopilotPageClient() {
  const pathname = usePathname()
  const session = usePicoSession()
  const autopilotVisuals = picoRobotAutopilotHighlights
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
  const [creatingApproval, setCreatingApproval] = useState(false)
  const [approvalDraft, setApprovalDraft] = useState({
    agentId: '',
    sessionId: '',
    actionType: 'OUTBOUND_SEND',
    summary: 'Outbound send requires a human decision before the runtime crosses the line.',
  })
  const storyRailClass =
    'mt-6 grid grid-flow-col auto-cols-[minmax(16rem,82vw)] gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:grid-flow-row md:auto-cols-auto md:overflow-visible xl:grid-cols-3'

  const pendingApprovals = useMemo(
    () => approvals.filter((approval) => approval.status === 'PENDING'),
    [approvals],
  )

  const resolvedApprovals = useMemo(
    () => approvals.filter((approval) => approval.status !== 'PENDING').slice(0, 4),
    [approvals],
  )

  const latestRun = runs[0] ?? null

  useEffect(() => {
    setApprovalDraft((current) => ({
      ...current,
      agentId: current.agentId || latestRun?.agent_id || 'agent-founder-lab',
      sessionId: current.sessionId || latestRun?.id || 'ses-pico-approval',
    }))
  }, [latestRun?.agent_id, latestRun?.id])

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
    if (progress.platform.activeSurface !== 'autopilot') {
      actions.setPlatform({ activeSurface: 'autopilot' })
    }
  }, [actions, progress.platform.activeSurface])

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
  const visibleTimeline = timeline.slice(0, 4)
  const visibleRuns = runs.slice(0, 3)
  const visibleAlerts = alerts.slice(0, 4)
  const visiblePendingApprovals = pendingApprovals.slice(0, 3)
  const visibleResolvedApprovals = resolvedApprovals.slice(0, 3)

  const integrationStatus = useMemo(
    () =>
      analyzeAutopilotIntegration({
        runs,
        alerts,
        approvals,
        budget,
        usage,
        approvalGateConfigured: progress.autopilot.approvalGateEnabled,
      }),
    [alerts, approvals, budget, progress.autopilot.approvalGateEnabled, runs, usage],
  )

  const runEmptyState = useMemo(
    () =>
      getRunsEmptyState(integrationStatus, {
        label: derived.nextLesson ? `Open ${derived.nextLesson.title}` : 'Open academy',
        href: derived.nextLesson ? toHref(`/academy/${derived.nextLesson.slug}`) : toHref('/academy'),
      }),
    [derived.nextLesson, integrationStatus, toHref],
  )

  const alertsEmptyState = useMemo(
    () =>
      getAlertsEmptyState(integrationStatus, {
        label: integrationStatus.hasRuns ? 'Inspect recent runs' : 'Get the first run live',
        href: integrationStatus.hasRuns
          ? '#recent-runs'
          : derived.nextLesson
            ? toHref(`/academy/${derived.nextLesson.slug}`)
            : toHref('/academy'),
      }),
    [derived.nextLesson, integrationStatus, toHref],
  )

  const usageEmptyState = useMemo(
    () =>
      getUsageEmptyState(integrationStatus, {
        label: integrationStatus.hasBudget ? 'Trigger real usage' : 'Set up budget visibility',
        href: integrationStatus.hasBudget
          ? '#recent-runs'
          : derived.nextLesson
            ? toHref(`/academy/${derived.nextLesson.slug}`)
            : toHref('/academy'),
      }),
    [derived.nextLesson, integrationStatus, toHref],
  )

  const approvalsEmptyState = useMemo(
    () =>
      getApprovalsEmptyState(integrationStatus, {
        label: integrationStatus.approvalGateConfigured ? 'Run a gated action' : 'Configure approval gate',
        href: integrationStatus.approvalGateConfigured
          ? '#recent-runs'
          : toHref('/academy/add-an-approval-gate'),
      }),
    [integrationStatus, toHref],
  )

  const loadStateLabel = useMemo(() => {
    if (authRequired) {
      return 'Auth required'
    }

    switch (loadState) {
      case 'loading':
        return 'Loading live data'
      case 'partial':
        return 'Partial live data'
      case 'offline':
        return 'Offline'
      default:
        return 'Live data ready'
    }
  }, [authRequired, loadState])
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

      actions.setAutopilot({ approvalGateEnabled: true })
      actions.unlockMilestone('first_approval_gate_enabled')
      await load()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : `Failed to ${action} request`)
    } finally {
      setResolvingApprovalId(null)
    }
  }

  async function createApprovalRequest() {
    if (!approvalDraft.agentId.trim() || !approvalDraft.sessionId.trim() || !approvalDraft.actionType.trim()) {
      setError('agent, session, and action type are required before creating an approval request')
      return
    }

    setCreatingApproval(true)
    setError(null)

    try {
      const response = await fetch('/api/pico/approvals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          agent_id: approvalDraft.agentId.trim(),
          session_id: approvalDraft.sessionId.trim(),
          action_type: approvalDraft.actionType.trim(),
          payload: {
            summary: approvalDraft.summary.trim(),
            source: 'pico-autopilot',
          },
        }),
      })

      const payload = await readJsonSafely(response)
      if (!response.ok) {
        if (response.status === 401) {
          setAuthRequired(true)
          setLoadState('offline')
        }

        throw new Error(extractErrorMessage(payload, 'Failed to create approval request'))
      }

      actions.setAutopilot({ approvalGateEnabled: true })
      await load()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to create approval request',
      )
    } finally {
      setCreatingApproval(false)
    }
  }

  const liveValue = (value: string) => (authRequired ? '--' : value)
  const liveHint = (readyHint: string, offlineHint: string) => (authRequired ? offlineHint : readyHint)
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
  const latestRunTimestamp = latestRun?.completed_at ?? latestRun?.started_at ?? latestRun?.created_at ?? null
  const latestRunTraces = latestRun ? tracesByRunId[latestRun.id] ?? [] : []
  const operatorDoctrine = [
    {
      label: '01 • Read',
      title: 'Start with the strongest live signal',
      body: authRequired
        ? 'Without a hosted session this room should refuse to improvise. Attach the live feed first.'
        : latestRun
          ? `Run ${latestRun.id.slice(0, 8)} is the first thing to read. ${describeRunDetail(latestRun, latestRunTraces)}`
          : 'No live run exists yet. The honest move is to trigger one real task before tuning anything else.',
    },
    {
      label: '02 • Judge',
      title: 'Make the decision line explicit',
      body: authRequired
        ? 'Budget review is unavailable until the live account is attached.'
        : budget
          ? `${formatPercent(budget.usage_percentage)} usage against a ${formatPercent(progress.autopilot.costThresholdPercent)} threshold. That line should tell you when a human steps in.`
          : 'No live budget snapshot yet. Do not pretend a threshold matters until it meets real spend.',
    },
    {
      label: '03 • Intervene',
      title: 'Keep risky actions reviewable',
      body:
        pendingApprovals.length > 0
          ? `${pendingApprovals.length} approval item${pendingApprovals.length === 1 ? '' : 's'} is waiting. Good. The dangerous work is still visible.`
          : progress.autopilot.approvalGateEnabled
            ? 'The gate is configured, but nothing is waiting right now. Keep it reviewable and boring.'
            : 'The gate is still off. Turn it on before a risky action becomes an invisible side effect.',
    },
  ]
  const recoveryWorkspace = usePicoLessonWorkspace(derived.nextLesson?.slug ?? 'autopilot', derived.nextLesson?.steps.length ?? 0, {
    progress,
    persistRemote: derived.nextLesson
      ? (lessonSlug, workspace) => actions.setLessonWorkspace(lessonSlug, workspace)
      : undefined,
  })
  const recoveryFocusedStep =
    derived.nextLesson && recoveryWorkspace.workspace.activeStepIndex >= 0
      ? derived.nextLesson.steps[recoveryWorkspace.workspace.activeStepIndex]?.title ?? 'not set'
      : 'not set'

  return (
    <PicoShell
      eyebrow="Autopilot bridge"
      title="Trust the runtime because the surface tells the truth"
      description="First inspect the latest run. Then tighten the threshold. Then decide which risky actions deserve a gate. That is how trust gets earned here."
      railCollapsed={progress.platform.railCollapsed}
      helpLaneOpen={progress.platform.helpLaneOpen}
      onToggleRail={() =>
        actions.setPlatform({ railCollapsed: !progress.platform.railCollapsed })
      }
      onToggleHelpLane={() =>
        actions.setPlatform({ helpLaneOpen: !progress.platform.helpLaneOpen })
      }
      actions={
        <Link
          href={primaryAutopilotHref}
          className={picoClasses.primaryButton}
        >
          {primaryAutopilotLabel}
        </Link>
      }
    >
      <PicoSessionBanner session={session} nextPath={pathname} />
      <PicoSurfaceCompass
        title="Stay here only when the live runtime is the real source of truth"
        body="Autopilot is for reading the current run, spend, alerts, and approvals. If the product still needs a lesson answer, go back to academy or tutor. If the runtime truth is visible but still not enough, escalate with the evidence attached."
        status={
          authRequired
            ? 'hosted session required'
            : latestRun
              ? 'runtime visible'
              : 'waiting for first run'
        }
        aside="A control room should not ask for faith. If there is no live signal, leave and create one. If the signal exists, use it to decide the next move immediately."
        items={[
          {
            href: derived.nextLesson ? toHref(`/academy/${derived.nextLesson.slug}`) : toHref('/academy'),
            label: derived.nextLesson ? `Finish ${derived.nextLesson.title}` : 'Go back to academy',
            caption: 'Return here when the real blocker is still on the lesson path rather than in the runtime.',
            note: 'Back to lane',
          },
          {
            href: toHref(`/tutor${derived.nextLesson ? `?lesson=${derived.nextLesson.slug}` : ''}`),
            label: 'Ask tutor about the next move',
            caption: 'Use tutor when the product likely still knows the answer and the issue is not live runtime state.',
            note: 'Knowable',
          },
          {
            href: '#recent-runs',
            label: 'Stay on recent runs',
            caption: 'Remain here when the latest execution, trace, or alert feed is the actual decision surface.',
            note: 'Stay here',
            tone: 'primary',
          },
          {
            href: toHref('/support'),
            label: 'Escalate with evidence',
            caption: 'Escalate only after you have the packet, the run context, and the live signal that proves where the truth broke.',
            note: 'Messy edge',
            tone: 'soft',
          },
        ]}
      />

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

      <section className={picoPanel('mb-6 p-6 sm:p-7')} data-testid="pico-autopilot-operator-doctrine">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr),20rem]">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className={picoClasses.label}>Operator doctrine</p>
                <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[color:var(--pico-text)]">
                  Read, judge, then intervene
                </h2>
              </div>
              <span className={picoClasses.chip}>signal • line • gate</span>
            </div>

            <div className={storyRailClass}>
              {operatorDoctrine.map((item) => (
                <article key={item.label} className={picoInset('snap-start flex h-full flex-col p-5')}>
                  <p className={picoClasses.label}>{item.label}</p>
                  <h3 className="mt-5 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-[color:var(--pico-text-secondary)]">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className={picoEmber('p-5')}>
              <p className={picoClasses.label}>Control room posture</p>
              <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                This surface should feel like an operator review room, not a dashboard that celebrates motion for its own sake.
              </p>
            </div>

            <div className={picoInset('p-5')}>
              <p className={picoClasses.label}>Decision line</p>
              <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                Start with the last run, compare it against the budget line, then decide whether the gate needs a human call. That order matters.
              </p>
            </div>

            <div className={picoInset('p-4')}>
              <p className={picoClasses.label}>Operator cues</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {autopilotVisuals.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[24px] border border-[color:var(--pico-border)] bg-[linear-gradient(180deg,rgba(8,15,9,0.96),rgba(4,7,4,1))] p-3"
                  >
                    <div className="overflow-hidden rounded-[20px] border border-[rgba(164,255,92,0.18)] bg-[radial-gradient(circle_at_50%_16%,rgba(var(--pico-accent-rgb),0.18),transparent_50%),linear-gradient(180deg,rgba(6,12,6,0.98),rgba(2,4,2,1))]">
                      <Image
                        src={item.src}
                        alt={item.alt}
                        width={512}
                        height={512}
                        className="h-auto w-full"
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 40vw, 20rem"
                      />
                    </div>
                    <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--pico-accent-bright)]">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      {item.caption}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr),22rem]">
        <div className={picoPanel('overflow-hidden p-0')}>
          <div className="grid gap-0 border-b border-[color:var(--pico-border)] lg:grid-cols-[minmax(0,1fr),18rem]">
            <div className="p-6 sm:p-7">
              <p className={picoClasses.label}>Control brief</p>
              <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[color:var(--pico-text)] sm:text-5xl">
                Read the runtime before you trust the automation
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[color:var(--pico-text-secondary)] sm:text-base">
                Autopilot only earns trust when the last run, the live spend, and the risky actions are visible in one surface. This page should feel like a control room, not a dashboard collage.
              </p>

              <div className={picoEmber('mt-6 p-5')}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={picoClasses.chip}>{loadStateLabel}</span>
                  <span className={picoClasses.chip}>
                    {authRequired ? 'Hosted session required' : 'Live control-plane feed'}
                  </span>
                  <span className={picoClasses.chip}>
                    {progress.autopilot.approvalGateEnabled ? 'Gate configured in Pico' : 'Gate still off in Pico'}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-[color:var(--pico-text-secondary)]">
                  {authRequired
                    ? 'Until a MUTX session is attached, this surface should refuse to invent truth. Use the academy to finish the setup path, then come back to read the real runtime.'
                    : latestRun
                      ? `Latest run ${latestRun.id.slice(0, 8)} is ${humanizeRunStatus(latestRun.status).toLowerCase()}${latestRunTimestamp ? ` as of ${formatTimestamp(latestRunTimestamp)}` : ''}. ${describeRunDetail(latestRun, latestRunTraces)}`
                      : 'No live run is visible yet. The next honest move is to finish the academy path, trigger one real task, and return here only once the runtime has something to say.'}
                </p>
              </div>

            </div>

            <div className="border-t border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] p-6 lg:border-l lg:border-t-0">
              <p className={picoClasses.label}>Operator rail</p>
              <div className="mt-4 grid gap-3">
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">Session status</p>
                  <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                    {authRequired ? 'auth required' : 'attached'}
                  </p>
                </div>
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">Progress sync</p>
                  <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">{syncState}</p>
                </div>
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">Budget line</p>
                  <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                    {formatPercent(progress.autopilot.costThresholdPercent)}
                  </p>
                </div>
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">Gate state</p>
                  <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                    {progress.autopilot.approvalGateEnabled ? 'enabled' : 'off'}
                  </p>
                </div>
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">Active surface</p>
                  <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                    {progress.platform.activeSurface ?? 'none'}
                  </p>
                </div>
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">Help lane</p>
                  <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                    {progress.platform.helpLaneOpen ? 'open' : 'closed'}
                  </p>
                </div>
              </div>

              <div className={picoInset('mt-4 p-4')}>
                <p className={picoClasses.label}>Jump to subsystem</p>
                <div className="mt-3 grid gap-2">
                  <Link href="#timeline-section" className={picoClasses.secondaryButton}>
                    Timeline
                  </Link>
                  <Link href="#recent-runs" className={picoClasses.tertiaryButton}>
                    Recent runs
                  </Link>
                  <Link href="#alerts-section" className={picoClasses.tertiaryButton}>
                    Alerts
                  </Link>
                  <Link href="#approvals-section" className={picoClasses.tertiaryButton}>
                    Approval queue
                  </Link>
                </div>
              </div>

              <div className={picoInset('mt-4 p-4')}>
                <p className={picoClasses.label}>If the feed is empty</p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  Do not dress up missing runtime data. Finish the academy path, trigger one real action, and come back only when MUTX has something to report.
                </p>
                <Link
                  href={derived.nextLesson ? toHref(`/academy/${derived.nextLesson.slug}`) : toHref('/academy')}
                  className={cn(picoClasses.secondaryButton, 'mt-4')}
                >
                  {derived.nextLesson ? `Open ${derived.nextLesson.title}` : 'Return to academy'}
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-t border-[color:var(--pico-border)] p-6 md:grid-cols-2 xl:grid-cols-5">
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
                failedRuns.length > 0
                  ? 'Failures are visible here. Good. Hidden failures are worse.'
                  : 'No failed runs in the current window.',
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
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className={picoPanel('p-5')}>
            <p className={picoClasses.label}>Control brief</p>
            <div className="mt-4 grid gap-3">
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">Latest run</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {authRequired
                    ? 'unavailable'
                    : latestRun
                      ? humanizeRunStatus(latestRun.status).toLowerCase()
                      : 'none yet'}
                </p>
              </div>
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">Threshold line</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {thresholdBreached ? 'breached' : 'clear'}
                </p>
              </div>
              {derived.nextLesson ? (
                <>
                  <div className={picoInset('p-4')} data-testid="pico-autopilot-academy-context">
                    <p className="text-sm text-[color:var(--pico-text-muted)]">Recovery lesson</p>
                    <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">{derived.nextLesson.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      {recoveryWorkspace.completedStepCount}/{derived.nextLesson.steps.length} steps
                    </p>
                    <p className="mt-2 text-sm font-medium text-[color:var(--pico-text)]">
                      {recoveryWorkspace.workspace.evidence.trim() ? 'captured' : 'missing'}
                    </p>
                  </div>
                  <div className={picoInset('p-4')}>
                    <p className="text-sm text-[color:var(--pico-text-muted)]">Workspace proof</p>
                    <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                      {recoveryWorkspace.workspace.evidence.trim() ? 'captured' : 'missing'}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      {recoveryWorkspace.completedStepCount}/{derived.nextLesson.steps.length} steps • {recoveryFocusedStep}
                    </p>
                  </div>
                </>
              ) : null}
            </div>
            <div className="mt-4 grid gap-3">
              <Link
                href={derived.nextLesson ? toHref(`/academy/${derived.nextLesson.slug}`) : toHref('/academy')}
                className={picoClasses.secondaryButton}
              >
                {derived.nextLesson ? `Open ${derived.nextLesson.title}` : 'Return to academy'}
              </Link>
              <Link
                href={toHref(`/tutor${derived.nextLesson ? `?lesson=${derived.nextLesson.slug}` : ''}`)}
                className={picoClasses.tertiaryButton}
              >
                Ask tutor about the next move
              </Link>
              <Link href={toHref('/support')} className={picoClasses.tertiaryButton}>
                Escalate to human help
              </Link>
            </div>
            <div className={picoSoft('mt-4 p-4')}>
              <p className={picoClasses.body}>
                Stay here when the runtime is the source of truth. If the lesson workspace is still incomplete, the academy remains the cleaner route back to a real answer.
              </p>
            </div>
          </section>
        </aside>
      </section>

      <section className={picoPanel('mt-6 p-6 sm:p-7')} data-testid="pico-autopilot-control-protocol">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className={picoClasses.label}>Control protocol</p>
            <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)] sm:text-4xl">
              Three operator checks before automation earns trust
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--pico-text-secondary)]">
              The control room should stage the first decisions in plain sight. Read the last run, read the spend line, and keep risky actions exposed before you touch anything more abstract.
            </p>
          </div>
          <span className={picoClasses.chip}>live operator checklist</span>
        </div>

        <div className={storyRailClass}>
          {controlProtocol.map((item) => (
            <article key={item.id} className={picoInset('snap-start flex h-full flex-col p-5 sm:p-6')}>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[color:var(--pico-border)] bg-[rgba(var(--pico-accent-rgb),0.12)] text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--pico-accent)]">
                  {item.id}
                </span>
                <span className={picoClasses.label}>Operator check</span>
              </div>
              <h3 className="mt-6 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                {item.title}
              </h3>
              <p className="mt-4 flex-1 text-sm leading-7 text-[color:var(--pico-text-secondary)]">{item.body}</p>
              <Link href={item.href} className={cn(picoClasses.link, 'mt-6 inline-flex')}>
                {item.action}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.08fr),22rem]">
        <div className="space-y-6">
          <div id="timeline-section" className={sectionClasses()}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className={picoClasses.label}>Signal narrative</p>
                <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                  Read the live story before you touch settings
                </h2>
                <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  This is the operator narrative. If the timeline is empty, the correct answer is that nothing meaningful has happened yet.
                </p>
              </div>
              <span className={picoClasses.chip}>{loadStateLabel}</span>
            </div>
            <div className="mt-5 space-y-4">
              {authRequired ? (
                <div className="rounded-[24px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] p-5 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  No timeline without live control-plane access. That is the honest answer.
                </div>
              ) : timeline.length === 0 ? (
                <EmptyStatePanel state={runEmptyState} />
              ) : (
                <>
                  {visibleTimeline.map((item) => <TimelineItemCard key={item.id} item={item} />)}
                  {timeline.length > visibleTimeline.length ? (
                    <div className={picoSoft('p-4')}>
                      <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                        {timeline.length - visibleTimeline.length} older signal{timeline.length - visibleTimeline.length === 1 ? '' : 's'} stayed out of view on purpose. Start with the strongest four.
                      </p>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div id="recent-runs" className={sectionClasses()}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className={picoClasses.label}>Run review</p>
                <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                  Recent execution review
                </h2>
                <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  Start here. Read the latest run before you touch thresholds or approvals.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void load()}
                className={picoClasses.secondaryButton}
              >
                Refresh live data
              </button>
            </div>
            <div className="mt-5 space-y-4">
              {authRequired ? (
                <div className="rounded-[24px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] p-5 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  Sign in, then come back here to inspect the first real run.
                </div>
              ) : runs.length === 0 ? (
                <EmptyStatePanel state={runEmptyState} />
              ) : (
                <>
                  {visibleRuns.map((run) => {
                  const severity = getRunSeverity(run.status)
                  const traces = tracesByRunId[run.id] ?? []
                  const runTimestamp = run.completed_at ?? run.started_at ?? run.created_at

                  return (
                    <article key={run.id} className={`rounded-[24px] border p-5 ${severityClasses(severity)}`}>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em]">{humanizeRunStatus(run.status)}</p>
                          <h3 className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                            Run {run.id.slice(0, 8)}
                          </h3>
                        </div>
                        <div className="text-right text-xs uppercase tracking-[0.18em] text-[color:var(--pico-text-secondary)]">
                          <p>{formatTimestamp(runTimestamp)}</p>
                          <p className="mt-1">{formatRelativeTime(runTimestamp)}</p>
                        </div>
                      </div>

                      <p className="mt-4 text-sm leading-7">{describeRunDetail(run, traces)}</p>

                      <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr),18rem]">
                        <div className={picoInset('p-4')}>
                          <p className={picoClasses.label}>Operator read</p>
                          <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                            {['FAILED', 'ERROR', 'CANCELLED'].includes(run.status.toUpperCase())
                              ? 'This job failed. If the agent is still trusted, it should be because you understand this failure.'
                              : ['RUNNING', 'QUEUED', 'PENDING'].includes(run.status.toUpperCase())
                                ? 'This work is still active. Long silence means you may have a stuck runtime.'
                                : 'The job finished. Now verify the output is useful, not just technically complete.'}
                          </p>
                        </div>

                        <div className={picoInset('p-4')}>
                          <p className={picoClasses.label}>Run facts</p>
                          <div className="mt-3 grid gap-2 text-sm text-[color:var(--pico-text-secondary)]">
                            <p>Agent: {run.agent_id ?? 'unknown'}</p>
                            <p>Trace count: {run.trace_count ?? traces.length}</p>
                            <p>
                              {run.started_at
                                ? `Started ${formatTimestamp(run.started_at)}`
                                : 'Start time unavailable'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className={picoInset('mt-4 p-4')}>
                        <p className={picoClasses.label}>Trace signals</p>
                        {traces.length === 0 ? (
                          <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                            No run traces were returned for this run.
                          </p>
                        ) : (
                          <div className="mt-3 grid gap-2">
                            {[...traces].slice(-3).reverse().map((trace) => (
                              <div
                                key={`${trace.run_id}-${trace.sequence ?? trace.timestamp ?? trace.event_type}`}
                                className={picoSoft('px-4 py-3')}
                              >
                                <p className="text-xs uppercase tracking-[0.16em] text-[#b09376]">
                                  {trace.event_type}
                                </p>
                                <p className="mt-1 text-sm leading-6 text-[color:var(--pico-text-secondary)]">{trace.message}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  )
                  })}
                  {runs.length > visibleRuns.length ? (
                    <div className={picoSoft('p-4')}>
                      <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                        {runs.length - visibleRuns.length} older run{runs.length - visibleRuns.length === 1 ? '' : 's'} are hidden so the review stays on the latest decisions first.
                      </p>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <div id="budget-section" className={sectionClasses()}>
            <p className={picoClasses.label}>Spend review</p>
            <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.05em] text-[color:var(--pico-text)]">
              Live spend and your line in the sand
            </h2>

            <div className="mt-5 grid gap-4">
              <div className={picoInset('p-5')}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={picoClasses.label}>Usage</p>
                    <p className="mt-3 font-[family:var(--font-site-display)] text-5xl tracking-[-0.06em] text-[color:var(--pico-text)]">
                      {authRequired ? '--' : budget ? formatPercent(budget.usage_percentage) : '--'}
                    </p>
                  </div>
                  <span className={picoClasses.chip}>
                    {thresholdBreached ? 'above threshold' : 'within threshold'}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {authRequired
                    ? 'Live budget requires authentication.'
                    : budget
                      ? `${budget.credits_used} used of ${budget.credits_total}. Reset ${budget.reset_date ? formatTimestamp(budget.reset_date) : 'unknown'}.`
                      : 'No live budget snapshot returned.'}
                </p>
              </div>

              <div className={picoSoft('p-5')}>
                <p className={picoClasses.label}>Threshold</p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  Pico stores the local budget line here. Real alert delivery still follows the live MUTX monitoring setup, so this surface refuses to pretend email or webhook routing is active when it is not.
                </p>

                <label className="mt-4 block text-sm text-[color:var(--pico-text-secondary)]">
                  <span className="block text-xs uppercase tracking-[0.24em] text-[color:var(--pico-text-muted)]">
                    Cost threshold percent
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={thresholdDraft}
                    onChange={(event) => {
                      setError(null)
                      setThresholdDraft(Number(event.target.value))
                    }}
                    className="mt-3 w-full rounded-2xl border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] px-4 py-3 text-sm text-[color:var(--pico-text)] outline-none"
                  />
                </label>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={saveThreshold}
                    disabled={Boolean(thresholdValidationError)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--pico-accent)] px-4 py-2 text-sm font-semibold text-[color:var(--pico-accent-contrast)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Save threshold
                  </button>
                  <span className={picoClasses.chip}>sync {syncState}</span>
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

              <div className="grid gap-4">
                <div className={picoInset('p-4')}>
                  <p className={picoClasses.label}>Top spenders</p>
                  <div className="mt-3 grid gap-2">
                    {authRequired ? (
                      <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">Sign in to read the usage breakdown.</p>
                    ) : usage?.usage_by_agent.length ? (
                      usage.usage_by_agent.slice(0, 3).map((item) => (
                        <div key={`${item.agent_id}-${item.agent_name}`} className={picoSoft('px-4 py-3')}>
                          <p className="font-medium text-[color:var(--pico-text)]">{item.agent_name}</p>
                          <p className="mt-1 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                            {item.credits_used} credits across {item.event_count} events
                          </p>
                        </div>
                      ))
                    ) : (
                      <EmptyStatePanel state={usageEmptyState} />
                    )}
                  </div>
                </div>

                <div className={picoInset('p-4')}>
                  <p className={picoClasses.label}>Usage drivers</p>
                  <div className="mt-3 grid gap-2">
                    {authRequired ? (
                      <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">Sign in to read the usage breakdown.</p>
                    ) : usage?.usage_by_type.length ? (
                      usage.usage_by_type.slice(0, 3).map((item) => (
                        <div key={item.event_type} className={picoSoft('px-4 py-3')}>
                          <p className="font-medium text-[color:var(--pico-text)]">{item.event_type}</p>
                          <p className="mt-1 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                            {item.credits_used} credits across {item.event_count} events
                          </p>
                        </div>
                      ))
                    ) : (
                      <EmptyStatePanel state={usageEmptyState} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div id="alerts-section" className={sectionClasses()}>
            <p className={picoClasses.label}>Alerts</p>
            <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.05em] text-[color:var(--pico-text)]">
              Meaningful monitoring events
            </h2>
            <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
              This is the live alert feed. No fake warning badges, no synthetic incidents.
            </p>

            <div className="mt-5 space-y-4">
              {authRequired ? (
                <div className="rounded-[24px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] p-5 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  Sign in to load live alerts.
                </div>
              ) : alerts.length === 0 ? (
                <EmptyStatePanel state={alertsEmptyState} />
              ) : (
                <>
                  {visibleAlerts.map((alert) => (
                    <article
                      key={alert.id}
                      className={`rounded-[24px] border p-5 ${severityClasses(alert.resolved ? 'good' : 'critical')}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em]">{alert.type}</p>
                          <h3 className="mt-2 text-lg font-semibold text-[color:var(--pico-text)]">
                            {alert.resolved ? 'Resolved alert' : 'Active alert'}
                          </h3>
                        </div>
                        <div className="text-right text-xs uppercase tracking-[0.18em] text-[color:var(--pico-text-secondary)]">
                          <p>{formatTimestamp(alert.resolved_at ?? alert.created_at)}</p>
                          <p className="mt-1">{formatRelativeTime(alert.resolved_at ?? alert.created_at)}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-6">{alert.message}</p>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-[color:var(--pico-text-secondary)]">
                        <span>Agent: {alert.agent_id}</span>
                        <span>{alert.resolved ? 'Resolved' : 'Still active'}</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                        Why it matters: {explainAlertImpact(alert)}
                      </p>
                    </article>
                  ))}
                  {alerts.length > visibleAlerts.length ? (
                    <div className={picoSoft('p-4')}>
                      <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                        {alerts.length - visibleAlerts.length} additional alert{alerts.length - visibleAlerts.length === 1 ? '' : 's'} are suppressed so the feed stays editorial instead of turning into a wall of badges.
                      </p>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </aside>
      </section>

      <section id="approvals-section" className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.08fr),22rem]">
        <div className={sectionClasses()}>
          <p className={picoClasses.label}>Approvals</p>
          <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.05em] text-[color:var(--pico-text)]">
            Risky actions and their decisions
          </h2>
          <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
            This queue is now the approval source of truth for Pico. It should not disappear because a process restarted.
          </p>

          <div className="mt-5 space-y-4">
            {authRequired ? (
              <div className="rounded-[24px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] p-5 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                Sign in to load live approval requests.
              </div>
            ) : (
              <>
                {pendingApprovals.length === 0 && resolvedApprovals.length === 0 ? (
                  <EmptyStatePanel state={approvalsEmptyState} />
                ) : null}

                {integrationStatus.hasApprovalRecords && !integrationStatus.approvalGateConfigured ? (
                  <div className="rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-5 text-sm leading-6 text-amber-50">
                    Approval records already exist in MUTX, but Pico still shows the gate as off locally. Turn on the gate here so the product state matches the control-plane reality.
                  </div>
                ) : null}

                {visiblePendingApprovals.map((approval) => (
                  <article key={approval.id} className={`rounded-[24px] border p-5 ${severityClasses('warn')}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em]">Pending</p>
                        <h3 className="mt-2 text-lg font-semibold text-[color:var(--pico-text)]">{approval.action_type}</h3>
                      </div>
                      <div className="text-right text-xs uppercase tracking-[0.18em] text-[color:var(--pico-text-secondary)]">
                        <p>{formatTimestamp(approval.created_at)}</p>
                        <p className="mt-1">{formatRelativeTime(approval.created_at)}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6">
                      {typeof approval.payload?.summary === 'string'
                        ? approval.payload.summary
                        : `${approval.requester} requested this action for agent ${approval.agent_id}.`}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      Why it matters: {explainApprovalImpact(approval)}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => void resolveApproval(approval.id, 'approve')}
                        disabled={resolvingApprovalId === approval.id}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--pico-accent)] px-4 py-2 text-sm font-semibold text-[color:var(--pico-accent-contrast)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {resolvingApprovalId === approval.id ? 'Working...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void resolveApproval(approval.id, 'reject')}
                        disabled={resolvingApprovalId === approval.id}
                        className="rounded-full border border-[color:var(--pico-border)] px-4 py-2 text-sm font-medium text-[color:var(--pico-text-secondary)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {resolvingApprovalId === approval.id ? 'Working...' : 'Reject'}
                      </button>
                    </div>
                  </article>
                ))}
                {pendingApprovals.length > visiblePendingApprovals.length ? (
                  <div className={picoSoft('p-4')}>
                    <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      {pendingApprovals.length - visiblePendingApprovals.length} more pending approval{pendingApprovals.length - visiblePendingApprovals.length === 1 ? '' : 's'} stayed out of view so the queue keeps the sharpest decisions on top.
                    </p>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className={picoPanel('p-5')}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className={picoClasses.label}>Create a gated action</p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  Exercise the live approval queue here instead of waiting for another surface to create the request first.
                </p>
              </div>
              <span className={picoClasses.chip}>live queue write</span>
            </div>

            <div className="mt-4 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <label className="grid gap-2 text-sm text-[color:var(--pico-text-secondary)]">
                  <span className={picoClasses.label}>Agent ID</span>
                  <input
                    value={approvalDraft.agentId}
                    onChange={(event) =>
                      setApprovalDraft((current) => ({ ...current, agentId: event.target.value }))
                    }
                    className="rounded-[20px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] px-4 py-3 text-[color:var(--pico-text)] outline-none placeholder:text-[color:var(--pico-text-muted)]"
                    placeholder="agent-founder-lab"
                  />
                </label>

                <label className="grid gap-2 text-sm text-[color:var(--pico-text-secondary)]">
                  <span className={picoClasses.label}>Session or run ID</span>
                  <input
                    value={approvalDraft.sessionId}
                    onChange={(event) =>
                      setApprovalDraft((current) => ({ ...current, sessionId: event.target.value }))
                    }
                    className="rounded-[20px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] px-4 py-3 text-[color:var(--pico-text)] outline-none placeholder:text-[color:var(--pico-text-muted)]"
                    placeholder="ses-pico-approval"
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm text-[color:var(--pico-text-secondary)]">
                <span className={picoClasses.label}>Action type</span>
                <input
                  value={approvalDraft.actionType}
                  onChange={(event) =>
                    setApprovalDraft((current) => ({ ...current, actionType: event.target.value }))
                  }
                  className="rounded-[20px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] px-4 py-3 text-[color:var(--pico-text)] outline-none placeholder:text-[color:var(--pico-text-muted)]"
                  placeholder="OUTBOUND_SEND"
                />
              </label>

              <label className="grid gap-2 text-sm text-[color:var(--pico-text-secondary)]">
                <span className={picoClasses.label}>Why this action needs a gate</span>
                <textarea
                  value={approvalDraft.summary}
                  onChange={(event) =>
                    setApprovalDraft((current) => ({ ...current, summary: event.target.value }))
                  }
                  rows={4}
                  className="rounded-[20px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] px-4 py-3 text-[color:var(--pico-text)] outline-none placeholder:text-[color:var(--pico-text-muted)]"
                  placeholder="Describe the risky action clearly."
                />
              </label>

              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => void createApprovalRequest()}
                  disabled={creatingApproval}
                  className={picoClasses.primaryButton}
                >
                  {creatingApproval ? 'Creating request...' : 'Create approval request'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setApprovalDraft({
                      agentId: latestRun?.agent_id || 'agent-founder-lab',
                      sessionId: latestRun?.id || 'ses-pico-approval',
                      actionType: 'OUTBOUND_SEND',
                      summary:
                        'Outbound send requires a human decision before the runtime crosses the line.',
                    })
                  }
                  className={picoClasses.secondaryButton}
                >
                  Reset draft
                </button>
              </div>
            </div>
          </section>

          <section className={picoPanel('p-5')}>
            <p className={picoClasses.label}>Gate status</p>
            <div className="mt-4 grid gap-3">
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">Pending actions</p>
                <p className="mt-1 text-2xl font-semibold text-[color:var(--pico-text)]">{liveValue(String(pendingApprovals.length))}</p>
              </div>
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">Decision history</p>
                <p className="mt-1 text-2xl font-semibold text-[color:var(--pico-text)]">{liveValue(String(resolvedApprovals.length))}</p>
              </div>
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">Configured locally</p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {progress.autopilot.approvalGateEnabled ? 'yes' : 'no'}
                </p>
              </div>
            </div>
          </section>

          {resolvedApprovals.length ? (
            <section className={picoPanel('p-5')}>
              <p className={picoClasses.label}>Recent decisions</p>
              <div className="mt-4 grid gap-3">
                {visibleResolvedApprovals.map((approval) => (
                  <article
                    key={approval.id}
                    className={`rounded-[24px] border p-4 ${severityClasses(approval.status === 'APPROVED' ? 'good' : 'critical')}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em]">{approval.status}</p>
                        <h3 className="mt-2 text-base font-semibold text-[color:var(--pico-text)]">{approval.action_type}</h3>
                      </div>
                      <span className={picoClasses.chip}>
                        {formatRelativeTime(approval.resolved_at ?? approval.created_at)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6">
                      {typeof approval.payload?.summary === 'string'
                        ? approval.payload.summary
                        : `${approval.requester} requested this action for agent ${approval.agent_id}.`}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      Why it matters: {explainApprovalImpact(approval)}
                    </p>
                  </article>
                ))}
                {resolvedApprovals.length > visibleResolvedApprovals.length ? (
                  <div className={picoSoft('p-4')}>
                    <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      {resolvedApprovals.length - visibleResolvedApprovals.length} older decision{resolvedApprovals.length - visibleResolvedApprovals.length === 1 ? '' : 's'} are hidden so the recent record stays readable.
                    </p>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}
        </aside>
      </section>
    </PicoShell>
  )
}
