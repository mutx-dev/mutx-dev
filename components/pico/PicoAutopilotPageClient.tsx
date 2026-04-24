'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { type AbstractIntlMessages, useLocale, useMessages, useTranslations } from 'next-intl'

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
  getRunSeverity,
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

type AutopilotPageMessages = (typeof import('@/messages/fr.json'))['pico']['autopilotPage']
type PicoContentMessages = (typeof import('@/messages/fr.json'))['pico']['content']
type MessageRecord = Record<string, unknown>
type TranslationValues = Record<string, string | number>

const defaultControlProtocol = [
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

function getAutopilotPageMessages(messages: AbstractIntlMessages) {
  const pico = (messages as {
    pico?: { autopilotPage?: AutopilotPageMessages; content?: PicoContentMessages }
  }).pico

  return {
    autopilotPage: pico?.autopilotPage,
    content: pico?.content,
  }
}

function getNestedMessage(messages: unknown, path: string): unknown {
  let current = messages

  for (const segment of path.split('.')) {
    if (Array.isArray(current)) {
      const index = Number(segment)
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        return undefined
      }

      current = current[index]
      continue
    }

    if (!current || typeof current !== 'object') {
      return undefined
    }

    current = (current as MessageRecord)[segment]
  }

  return current
}

function formatFallback(template: string, values?: TranslationValues) {
  if (!values) {
    return template
  }

  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = values[key]
    return value === undefined ? `{${key}}` : String(value)
  })
}

function toDate(value?: string | null) {
  if (!value) return null

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function fallbackTimestamp(...values: Array<string | null | undefined>): string | null {
  return values.find((value) => typeof value === "string" && value.trim()) ?? null
}

function excerpt(value?: string | null, max = 140) {
  if (!value) return null

  const compact = value.replace(/\s+/g, ' ').trim()
  if (!compact) return null
  if (compact.length <= max) return compact
  if (max <= 3) return '.'.repeat(Math.max(0, max))
  return `${compact.slice(0, max - 3)}...`
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
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

function TimelineItemCard({
  item,
  formatTimestamp,
  formatRelativeTime,
  whyItMattersLabel,
  jumpLabel,
}: {
  item: AutopilotTimelineItem
  formatTimestamp: (value?: string | null) => string
  formatRelativeTime: (value?: string | null) => string
  whyItMattersLabel: string
  jumpLabel: string
}) {
  return (
    <div className={`rounded-[24px] border p-5 ${severityClasses(item.severity)}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-[0.18em]">
        <span>{item.sourceLabel}</span>
        <span>{formatTimestamp(item.occurredAt)} • {formatRelativeTime(item.occurredAt)}</span>
      </div>
      <h3 className="mt-3 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">{item.title}</h3>
      <p className="mt-2 text-sm leading-6">{item.detail}</p>
      <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
        {formatFallback(whyItMattersLabel, { impact: item.impact })}
      </p>
      <Link href={item.href} className={cn(picoClasses.link, 'mt-4 inline-flex')}>
        {jumpLabel}
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
  const locale = useLocale()
  const messages = useMessages() as AbstractIntlMessages
  const pageT = useTranslations('pico.autopilotPage')
  const { content } = getAutopilotPageMessages(messages)
  const session = usePicoSession()
  const { progress, derived, actions, syncState } = usePicoProgress()
  const toHref = usePicoHref()
  const readMessage = (path: string) => getNestedMessage(messages, path)
  const readPageMessage = (path: string) => readMessage(`pico.autopilotPage.${path}`)
  const readPageString = (path: string, fallback: string) => {
    const value = readPageMessage(path)
    return typeof value === 'string' ? value : fallback
  }
  const tt = (path: string, fallback: string, values?: TranslationValues) => {
    if (readPageMessage(path) !== undefined) {
      return pageT(path, values)
    }

    return formatFallback(fallback, values)
  }
  const localizedLessons = (content?.lessons ?? {}) as Record<
    string,
    { title?: string; steps?: Array<{ title?: string }> }
  >
  const localizedNextLesson = useMemo(
    () => {
      const nextLesson = derived.nextLesson

      return nextLesson
        ? {
            ...nextLesson,
            title: localizedLessons[nextLesson.slug]?.title ?? nextLesson.title,
            steps: nextLesson.steps.map((step, index) => ({
              ...step,
              title: localizedLessons[nextLesson.slug]?.steps?.[index]?.title ?? step.title,
            })),
          }
        : null
    },
    [derived.nextLesson, localizedLessons],
  )
  const controlProtocol = useMemo(
    () =>
      defaultControlProtocol.map((item, index) => ({
        ...item,
        id: readPageString(`controlProtocol.steps.${index}.id`, item.id),
        title: readPageString(`controlProtocol.steps.${index}.title`, item.title),
        body: readPageString(`controlProtocol.steps.${index}.body`, item.body),
        action: readPageString(`controlProtocol.steps.${index}.action`, item.action),
      })),
    [messages],
  )
  const autopilotVisuals = useMemo(
    () =>
      picoRobotAutopilotHighlights.map((item, index) => ({
        ...item,
        alt: readPageString(`operatorDoctrine.visuals.${index}.alt`, item.alt),
        title: readPageString(`operatorDoctrine.visuals.${index}.title`, item.title),
        caption: readPageString(`operatorDoctrine.visuals.${index}.caption`, item.caption),
      })),
    [messages],
  )
  const approvalSummaryDefault = tt(
    'composer.summaryDefault',
    'Outbound send requires a human decision before the runtime crosses the line.',
  )
  const timelineWhyItMattersLabel = tt(
    'shared.label.whyItMatters',
    'Why it matters: {impact}',
  )
  const timelineJumpLabel = tt(
    'shared.action.jumpToDetail',
    'Jump to detail section',
  )
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
  const [approvalDraft, setApprovalDraft] = useState(() => ({
    agentId: '',
    sessionId: '',
    actionType: 'OUTBOUND_SEND',
    summary: approvalSummaryDefault,
  }))
  const storyRailClass =
    'mt-6 grid grid-flow-col auto-cols-[minmax(16rem,82vw)] gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:grid-flow-row md:auto-cols-auto md:overflow-visible xl:grid-cols-3'
  const timestampFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [locale],
  )
  const relativeTimeFormatter = useMemo(
    () => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }),
    [locale],
  )
  const percentFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: 'percent',
        maximumFractionDigits: 0,
      }),
    [locale],
  )
  const formatTimestamp = (value?: string | null) => {
    const date = toDate(value)
    if (!date) {
      return tt('shared.time.unknown', 'Unknown time')
    }

    return timestampFormatter.format(date)
  }
  const formatRelativeTime = (value?: string | null, now = new Date()) => {
    const date = toDate(value)
    if (!date) {
      return tt('shared.time.unknownRelative', 'unknown time')
    }

    const diffMs = date.getTime() - now.getTime()
    const diffMinutes = Math.round(diffMs / 60000)

    if (Math.abs(diffMinutes) < 60) {
      return relativeTimeFormatter.format(diffMinutes, 'minute')
    }

    const diffHours = Math.round(diffMinutes / 60)
    if (Math.abs(diffHours) < 48) {
      return relativeTimeFormatter.format(diffHours, 'hour')
    }

    const diffDays = Math.round(diffHours / 24)
    return relativeTimeFormatter.format(diffDays, 'day')
  }
  const formatPercent = (value: number) => {
    if (!Number.isFinite(value)) {
      return '--'
    }

    return percentFormatter.format(value / 100)
  }
  const humanizeRunStatus = (status: string) => {
    const normalized = status.toUpperCase()
    return readPageMessage(`shared.statusLabels.${normalized}`) !== undefined
      ? pageT(`shared.statusLabels.${normalized}`)
      : titleCase(status)
  }
  const syncStateLabel = (value: string) =>
    readPageMessage(`shared.syncStateLabels.${value}`) !== undefined
      ? pageT(`shared.syncStateLabels.${value}`)
      : value
  const describeRunDetail = (run: AutopilotRunSummary, traces: AutopilotRunTrace[] = []) => {
    const status = run.status.toUpperCase()
    const latestTrace = traces
      .filter((trace) => typeof trace.message === 'string' && trace.message.trim())
      .reduce<AutopilotRunTrace | undefined>((latest, trace) => {
        if (!latest) return trace

        return new Date(trace.timestamp ?? 0).getTime() >
          new Date(latest.timestamp ?? 0).getTime()
          ? trace
          : latest
      }, undefined)

    if (['FAILED', 'ERROR', 'CANCELLED'].includes(status)) {
      return (
        excerpt(run.error_message) ??
        excerpt(latestTrace?.message) ??
        tt(
          'shared.runDetail.failedNoMessage',
          'The run stopped without a stored error message.',
        )
      )
    }

    if (['RUNNING', 'QUEUED', 'PENDING'].includes(status)) {
      return (
        excerpt(latestTrace?.message) ??
        tt('shared.runDetail.inFlight', 'The run is still moving through the pipeline.')
      )
    }

    if (status === 'AWAITING_OWNER') {
      return (
        excerpt(latestTrace?.message) ??
        tt(
          'shared.runDetail.awaitingOwner',
          'The run is paused and waiting for owner input before continuing.',
        )
      )
    }

    return (
      excerpt(run.output_text) ??
      excerpt(latestTrace?.message) ??
      excerpt(run.input_text) ??
      tt(
        'shared.runDetail.completedNoSummary',
        'The run completed without a short summary.',
      )
    )
  }
  const explainRunImpact = (run: AutopilotRunSummary) => {
    const status = run.status.toUpperCase()
    if (['FAILED', 'ERROR', 'CANCELLED'].includes(status)) {
      return tt(
        'shared.runImpact.failed',
        'This workflow did not finish cleanly. Check the error and traces before trusting the next attempt.',
      )
    }

    if (['RUNNING', 'QUEUED', 'PENDING'].includes(status)) {
      return tt(
        'shared.runImpact.active',
        'Work is still in flight. Watch for hangs, retries, or silence that lasts too long.',
      )
    }

    if (status === 'AWAITING_OWNER') {
      return tt(
        'shared.runImpact.awaitingOwner',
        'The run is paused waiting for owner action. Respond to unblock the pipeline.',
      )
    }

    return tt(
      'shared.runImpact.completed',
      'This run completed. Verify the output is actually useful before you automate it harder.',
    )
  }
  const explainAlertImpact = (alert: AutopilotAlertSummary) =>
    alert.resolved
      ? tt(
          'shared.alertImpact.resolved',
          'The alert is cleared, but you still want the root cause to make sense.',
        )
      : tt(
          'shared.alertImpact.active',
          'This is active operator pain. If you ignore it, the runtime will keep surprising you.',
        )
  const explainApprovalImpact = (approval: AutopilotApprovalSummary) => {
    const normalized = approval.status.toUpperCase()
    if (normalized === 'PENDING') {
      return tt(
        'shared.approvalImpact.pending',
        'A risky action is waiting for a human decision. Nothing should proceed past this gate yet.',
      )
    }

    if (normalized === 'APPROVED') {
      return tt(
        'shared.approvalImpact.approved',
        'The gate opened. Make sure the approved action actually matches the request you intended to allow.',
      )
    }

    if (normalized === 'REJECTED') {
      return tt(
        'shared.approvalImpact.rejected',
        'The risky action was blocked. Good. Now decide whether the request was wrong or the guardrail is too strict.',
      )
    }

    return tt(
      'shared.approvalImpact.changed',
      'This approval changed state and should be reviewed if it affects live behavior.',
    )
  }
  const buildAutopilotTimeline = (input: {
    runs: AutopilotRunSummary[]
    alerts: AutopilotAlertSummary[]
    approvals: AutopilotApprovalSummary[]
    tracesByRunId?: Record<string, AutopilotRunTrace[]>
  }): AutopilotTimelineItem[] => {
    const timeline: AutopilotTimelineItem[] = []
    const localTracesByRunId = input.tracesByRunId ?? {}

    input.runs.forEach((run) => {
      timeline.push({
        id: `run-${run.id}`,
        kind: 'run',
        occurredAt: fallbackTimestamp(run.completed_at, run.started_at, run.created_at),
        title: tt('shared.timeline.runTitle', '{status} run {runId}', {
          status: humanizeRunStatus(run.status),
          runId: run.id.slice(0, 8),
        }),
        detail: describeRunDetail(run, localTracesByRunId[run.id] ?? []),
        impact: explainRunImpact(run),
        severity: getRunSeverity(run.status),
        href: '#runs-section',
        sourceLabel: tt('shared.timelineSources.runs', 'Runs'),
      })
    })

    input.alerts.forEach((alert) => {
      timeline.push({
        id: `alert-${alert.id}`,
        kind: 'alert',
        occurredAt: fallbackTimestamp(alert.resolved_at, alert.created_at),
        title: tt('shared.timeline.alertTitle', '{type} {state}', {
          type: titleCase(alert.type),
          state: alert.resolved
            ? tt('shared.timeline.alertResolved', 'resolved')
            : tt('shared.timeline.alertTriggered', 'triggered'),
        }),
        detail:
          excerpt(alert.message, 180) ??
          tt('shared.timeline.alertNoMessage', 'Alert recorded without a message.'),
        impact: explainAlertImpact(alert),
        severity: alert.resolved ? 'good' : 'critical',
        href: '#alerts-section',
        sourceLabel: tt('shared.timelineSources.alerts', 'Alerts'),
      })
    })

    const getApprovalSeverity = (
      status: string,
    ): 'warn' | 'good' | 'critical' | 'neutral' => {
      switch (status) {
        case 'PENDING':
          return 'warn'
        case 'APPROVED':
          return 'good'
        case 'REJECTED':
          return 'critical'
        default:
          return 'neutral'
      }
    }

    input.approvals.forEach((approval) => {
      const normalized = approval.status.toUpperCase()
      const approvalStatus =
        normalized === 'PENDING'
          ? tt('shared.timeline.approvalStatus.pending', 'pending')
          : normalized === 'APPROVED'
            ? tt('shared.timeline.approvalStatus.approved', 'approved')
            : normalized === 'REJECTED'
              ? tt('shared.timeline.approvalStatus.rejected', 'rejected')
              : normalized.toLowerCase()
      const summary =
        typeof approval.payload?.summary === 'string' && approval.payload.summary.trim()
          ? approval.payload.summary
          : tt('shared.timeline.approvalRequestedBy', 'Requested by {requester}.', {
              requester: approval.requester,
            })

      timeline.push({
        id: `approval-${approval.id}`,
        kind: 'approval',
        occurredAt: fallbackTimestamp(approval.resolved_at, approval.created_at),
        title: tt('shared.timeline.approvalTitle', '{action} {status}', {
          action: titleCase(approval.action_type),
          status: approvalStatus,
        }),
        detail:
          excerpt(summary, 180) ??
          tt('shared.timeline.approvalRequestedBy', 'Requested by {requester}.', {
            requester: approval.requester,
          }),
        impact: explainApprovalImpact(approval),
        severity: getApprovalSeverity(normalized),
        href: '#approvals-section',
        sourceLabel: tt('shared.timelineSources.approvals', 'Approvals'),
      })
    })

    return timeline.sort((left, right) => {
      const rightTime = toDate(right.occurredAt)?.getTime() ?? 0
      const leftTime = toDate(left.occurredAt)?.getTime() ?? 0
      return rightTime - leftTime
    })
  }
  const getRunsEmptyState = (
    status: ReturnType<typeof analyzeAutopilotIntegration>,
    nextStep: { label: string; href: string },
  ): AutopilotEmptyState => {
    if (!status.hasLiveAgent) {
      return {
        title: tt(
          'emptyStates.runs.noAgent.title',
          'No monitored agent exists yet',
        ),
        body: tt(
          'emptyStates.runs.noAgent.body',
          'Pico has no real MUTX agent to attach to. Create or deploy one actual agent first, then come back for run history.',
        ),
        nextStep,
      }
    }

    return {
      title: tt(
        'emptyStates.runs.noHistory.title',
        'An agent exists, but nothing has run yet',
      ),
      body: tt(
        'emptyStates.runs.noHistory.body',
        'MUTX knows about at least one agent, but there is no run history yet. Trigger one real task or wait for the first schedule tick, then come back here.',
      ),
      nextStep,
    }
  }
  const getAlertsEmptyState = (
    status: ReturnType<typeof analyzeAutopilotIntegration>,
    nextStep: { label: string; href: string },
  ): AutopilotEmptyState => {
    if (!status.hasRuns) {
      return {
        title: tt(
          'emptyStates.alerts.noRuns.title',
          'No alerts because nothing is running yet',
        ),
        body: tt(
          'emptyStates.alerts.noRuns.body',
          'An empty alert feed means nothing until the agent has executed real work. Get one run into MUTX first.',
        ),
        nextStep,
      }
    }

    return {
      title: tt('emptyStates.alerts.none.title', 'No live alerts right now'),
      body: tt(
        'emptyStates.alerts.none.body',
        'Good. The monitoring feed is quiet right now. Keep watching the next real run and failure path.',
      ),
      nextStep,
    }
  }
  const getUsageEmptyState = (
    status: ReturnType<typeof analyzeAutopilotIntegration>,
    nextStep: { label: string; href: string },
  ): AutopilotEmptyState => {
    if (!status.hasBudget) {
      return {
        title: tt(
          'emptyStates.usage.noBudget.title',
          'No live budget snapshot yet',
        ),
        body: tt(
          'emptyStates.usage.noBudget.body',
          'There is no MUTX budget snapshot to compare against yet. Until that exists, cost awareness is incomplete.',
        ),
        nextStep,
      }
    }

    return {
      title: tt('emptyStates.usage.empty.title', 'Budget exists, but usage is empty'),
      body: tt(
        'emptyStates.usage.empty.body',
        'The budget surface is live, but no usage events landed in the current window. Either the agent has not spent anything yet or usage emission is missing.',
      ),
      nextStep,
    }
  }
  const getApprovalsEmptyState = (
    status: ReturnType<typeof analyzeAutopilotIntegration>,
    nextStep: { label: string; href: string },
  ): AutopilotEmptyState => {
    if (!status.hasLiveAgent) {
      return {
        title: tt('emptyStates.approvals.noAgent.title', 'No agent exists to gate yet'),
        body: tt(
          'emptyStates.approvals.noAgent.body',
          'Approval queues only matter when a real agent is capable of doing something risky. Create or deploy the agent first.',
        ),
        nextStep,
      }
    }

    if (status.hasApprovalRecords && !status.approvalGateConfigured) {
      return {
        title: tt(
          'emptyStates.approvals.gateOff.title',
          'Approval history exists, but the gate is off locally',
        ),
        body: tt(
          'emptyStates.approvals.gateOff.body',
          'MUTX already has approval records, but Pico still says the gate is disabled. Turn the gate on here so local product state matches the control-plane reality.',
        ),
        nextStep,
      }
    }

    return {
      title: tt('emptyStates.approvals.none.title', 'No approval records yet'),
      body: tt(
        'emptyStates.approvals.none.body',
        'Nothing risky has been routed through the real approval queue yet. Exercise one real gated action before you call this governed.',
      ),
      nextStep,
    }
  }

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
        setError(
          tt(
            'shared.error.partialSignals',
            'Some live MUTX signals failed to load. What is shown is partial, not fabricated.',
          ),
        )
      }
    } catch (loadError) {
      setLoadState('partial')
      setError(
        loadError instanceof Error
          ? loadError.message
          : tt('shared.error.loadLiveData', 'Failed to load live autopilot data'),
      )
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
      return tt('shared.validation.thresholdRange', 'Enter a threshold between 1 and 100.')
    }

    if (thresholdDraft < 1 || thresholdDraft > 100) {
      return tt('shared.validation.thresholdRange', 'Enter a threshold between 1 and 100.')
    }

    return null
  }, [messages, thresholdDraft])

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
        tracesByRunId,
      }).slice(0, 10),
    [alerts, approvals, messages, runs, tracesByRunId],
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
        label: localizedNextLesson
          ? tt('shared.action.openLesson', 'Open {lessonTitle}', {
              lessonTitle: localizedNextLesson.title,
            })
          : tt('emptyStates.runs.openAcademy', 'Open academy'),
        href: localizedNextLesson
          ? toHref(`/academy/${localizedNextLesson.slug}`)
          : toHref('/academy'),
      }),
    [integrationStatus, localizedNextLesson, messages, toHref],
  )

  const alertsEmptyState = useMemo(
    () =>
      getAlertsEmptyState(integrationStatus, {
        label: integrationStatus.hasRuns
          ? tt('emptyStates.alerts.inspectRecentRuns', 'Inspect recent runs')
          : tt('emptyStates.alerts.getFirstRunLive', 'Get the first run live'),
        href: integrationStatus.hasRuns
          ? '#recent-runs'
          : localizedNextLesson
            ? toHref(`/academy/${localizedNextLesson.slug}`)
            : toHref('/academy'),
      }),
    [integrationStatus, localizedNextLesson, messages, toHref],
  )

  const usageEmptyState = useMemo(
    () =>
      getUsageEmptyState(integrationStatus, {
        label: integrationStatus.hasBudget
          ? tt('emptyStates.usage.triggerRealUsage', 'Trigger real usage')
          : tt('emptyStates.usage.setupBudgetVisibility', 'Set up budget visibility'),
        href: integrationStatus.hasBudget
          ? '#recent-runs'
          : localizedNextLesson
            ? toHref(`/academy/${localizedNextLesson.slug}`)
            : toHref('/academy'),
      }),
    [integrationStatus, localizedNextLesson, messages, toHref],
  )

  const approvalsEmptyState = useMemo(
    () =>
      getApprovalsEmptyState(integrationStatus, {
        label: integrationStatus.approvalGateConfigured
          ? tt('emptyStates.approvals.runGatedAction', 'Run a gated action')
          : tt('emptyStates.approvals.configureApprovalGate', 'Configure approval gate'),
        href: integrationStatus.approvalGateConfigured
          ? '#recent-runs'
          : toHref('/academy/add-an-approval-gate'),
      }),
    [integrationStatus, messages, toHref],
  )

  const loadStateLabel = useMemo(() => {
    if (authRequired) {
      return tt('shared.loadState.authRequired', 'Auth required')
    }

    switch (loadState) {
      case 'loading':
        return tt('shared.loadState.loading', 'Loading live data')
      case 'partial':
        return tt('shared.loadState.partial', 'Partial live data')
      case 'offline':
        return tt('shared.loadState.offline', 'Offline')
      default:
        return tt('shared.loadState.ready', 'Live data ready')
    }
  }, [authRequired, loadState, messages])
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

        throw new Error(
          extractErrorMessage(
            payload,
            tt('shared.error.resolveRequest', 'Failed to {action} request', {
              action:
                action === 'approve'
                  ? readPageString('approvals.card.approve', 'Approve').toLowerCase()
                  : readPageString('approvals.card.reject', 'Reject').toLowerCase(),
            }),
          ),
        )
      }

      actions.setAutopilot({ approvalGateEnabled: true })
      actions.unlockMilestone('first_approval_gate_enabled')
      await load()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : tt('shared.error.resolveRequest', 'Failed to {action} request', {
              action:
                action === 'approve'
                  ? readPageString('approvals.card.approve', 'Approve').toLowerCase()
                  : readPageString('approvals.card.reject', 'Reject').toLowerCase(),
            }),
      )
    } finally {
      setResolvingApprovalId(null)
    }
  }

  async function createApprovalRequest() {
    if (!approvalDraft.agentId.trim() || !approvalDraft.sessionId.trim() || !approvalDraft.actionType.trim()) {
      setError(
        tt(
          'shared.error.createApprovalRequiredFields',
          'agent, session, and action type are required before creating an approval request',
        ),
      )
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

        throw new Error(
          extractErrorMessage(
            payload,
            tt('shared.error.createApproval', 'Failed to create approval request'),
          ),
        )
      }

      actions.setAutopilot({ approvalGateEnabled: true })
      await load()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : tt('shared.error.createApproval', 'Failed to create approval request'),
      )
    } finally {
      setCreatingApproval(false)
    }
  }

  const liveValue = (value: string) => (authRequired ? '--' : value)
  const liveHint = (readyHint: string, offlineHint: string) => (authRequired ? offlineHint : readyHint)
  const primaryAutopilotHref = authRequired || !latestRun
    ? localizedNextLesson
      ? toHref(`/academy/${localizedNextLesson.slug}`)
      : toHref('/academy')
    : '#recent-runs'
  const primaryAutopilotLabel = authRequired || !latestRun
    ? localizedNextLesson
      ? tt('hero.primaryAction.finishLesson', 'Finish {lessonTitle} first', {
          lessonTitle: localizedNextLesson.title,
        })
      : tt('hero.primaryAction.goBackToAcademy', 'Go back to academy')
    : tt('hero.primaryAction.inspectRun', 'Inspect run {runId}', {
        runId: latestRun.id.slice(0, 8),
      })
  const latestRunTimestamp = latestRun?.completed_at ?? latestRun?.started_at ?? latestRun?.created_at ?? null
  const latestRunTraces = latestRun ? tracesByRunId[latestRun.id] ?? [] : []
  const operatorDoctrine = [
    {
      label: tt('operatorDoctrine.step.read.label', '01 • Read'),
      title: tt(
        'operatorDoctrine.step.read.title',
        'Start with the strongest live signal',
      ),
      body: authRequired
        ? tt(
            'operatorDoctrine.step.read.authRequired',
            'Without a hosted session this room should refuse to improvise. Attach the live feed first.',
          )
        : latestRun
          ? tt('operatorDoctrine.step.read.withRun', 'Run {runId} is the first thing to read. {detail}', {
              runId: latestRun.id.slice(0, 8),
              detail: describeRunDetail(latestRun, latestRunTraces),
            })
          : tt(
              'operatorDoctrine.step.read.noRun',
              'No live run exists yet. The honest move is to trigger one real task before tuning anything else.',
            ),
    },
    {
      label: tt('operatorDoctrine.step.judge.label', '02 • Judge'),
      title: tt(
        'operatorDoctrine.step.judge.title',
        'Make the decision line explicit',
      ),
      body: authRequired
        ? tt(
            'operatorDoctrine.step.judge.authRequired',
            'Budget review is unavailable until the live account is attached.',
          )
        : budget
          ? tt(
              'operatorDoctrine.step.judge.withBudget',
              '{usage} usage against a {threshold} threshold. That line should tell you when a human steps in.',
              {
                usage: formatPercent(budget.usage_percentage),
                threshold: formatPercent(progress.autopilot.costThresholdPercent),
              },
            )
          : tt(
              'operatorDoctrine.step.judge.noBudget',
              'No live budget snapshot yet. Do not pretend a threshold matters until it meets real spend.',
            ),
    },
    {
      label: tt('operatorDoctrine.step.intervene.label', '03 • Intervene'),
      title: tt(
        'operatorDoctrine.step.intervene.title',
        'Keep risky actions reviewable',
      ),
      body:
        pendingApprovals.length > 0
          ? tt(
              'operatorDoctrine.step.intervene.pending',
              '{count} approval item{pluralSuffix} is waiting. Good. The dangerous work is still visible.',
              {
                count: pendingApprovals.length,
                pluralSuffix: pendingApprovals.length === 1 ? '' : 's',
              },
            )
          : progress.autopilot.approvalGateEnabled
            ? tt(
                'operatorDoctrine.step.intervene.configured',
                'The gate is configured, but nothing is waiting right now. Keep it reviewable and boring.',
              )
            : tt(
                'operatorDoctrine.step.intervene.off',
                'The gate is still off. Turn it on before a risky action becomes an invisible side effect.',
              ),
    },
  ]
  const recoveryWorkspace = usePicoLessonWorkspace(localizedNextLesson?.slug ?? 'autopilot', localizedNextLesson?.steps.length ?? 0, {
    progress,
    persistRemote: localizedNextLesson
      ? (lessonSlug, workspace) => actions.setLessonWorkspace(lessonSlug, workspace)
      : undefined,
  })
  const recoveryFocusedStep =
    localizedNextLesson && recoveryWorkspace.workspace.activeStepIndex >= 0
      ? localizedNextLesson.steps[recoveryWorkspace.workspace.activeStepIndex]?.title ??
        tt('hero.packet.recoveryNotSet', 'not set')
      : tt('hero.packet.recoveryNotSet', 'not set')
  const heroRunSignal = authRequired
    ? tt('hero.runState.authRequired', 'auth required')
    : latestRun
      ? humanizeRunStatus(latestRun.status).toLowerCase()
      : tt('hero.runState.noLiveRun', 'no live run')
  const heroBudgetSignal = authRequired
    ? tt('hero.budgetLine.offline', 'offline')
    : budget
      ? formatPercent(budget.usage_percentage)
      : tt('hero.budgetLine.pending', 'pending')
  const heroGateSignal =
    pendingApprovals.length > 0
      ? tt('hero.gateState.waiting', '{count} waiting', { count: pendingApprovals.length })
      : progress.autopilot.approvalGateEnabled
        ? tt('hero.gateState.armed', 'armed')
        : tt('hero.gateState.off', 'off')
  const autopilotPacketPreview = [
    tt('hero.packet.run', 'Run {value}', {
      value: latestRun ? latestRun.id.slice(0, 8) : tt('hero.packet.runNone', 'none yet'),
    }),
    tt('hero.packet.budget', 'Budget {value}', { value: heroBudgetSignal }),
    tt('hero.packet.gate', 'Gate {value}', { value: heroGateSignal }),
    tt('hero.packet.recovery', 'Recovery {value}', { value: recoveryFocusedStep }),
  ].join('\n')

  return (
    <PicoShell
      eyebrow={tt('shell.eyebrow', 'Autopilot bridge')}
      title={tt(
        'shell.title',
        'Trust the runtime because the surface tells the truth',
      )}
      description={tt(
        'shell.description',
        'Inspect the latest run, compare it to live spend, then decide which risky actions deserve a gate. That is how trust gets earned here.',
      )}
      heroContent={
        <div
          className="relative overflow-hidden rounded-[28px] border border-[color:var(--pico-border-hover)] bg-[linear-gradient(135deg,rgba(var(--pico-accent-rgb),0.14),rgba(8,14,9,0.92)_36%,rgba(255,255,255,0.02)_100%)] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-6"
          data-testid="pico-autopilot-hero-signal"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_30%,transparent_72%,rgba(255,255,255,0.02))]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-10 top-8 h-40 w-40 rounded-full bg-[rgba(var(--pico-accent-rgb),0.12)] blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 rounded-full bg-[rgba(var(--pico-accent-rgb),0.1)] blur-3xl"
          />
            <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr),18rem]">
              <div className="grid gap-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={picoClasses.chip}>
                    {tt('hero.runtimePulse', 'Runtime pulse')}
                  </span>
                  <span className="inline-flex rounded-full border border-[color:var(--pico-border)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--pico-text-secondary)]">
                    {loadStateLabel}
                  </span>
                </div>
              <h2 className="font-[family:var(--font-site-display)] text-[clamp(1.9rem,4vw,2.9rem)] leading-[0.94] tracking-[-0.06em] text-[color:var(--pico-text)]">
                  {tt('hero.headline', 'Keep the run, spend, and gate in the same frame.')}
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {tt(
                    'hero.body',
                    'Start with the latest execution, compare it to the current budget line, then decide whether a human gate belongs in the way. That order keeps the control room honest.',
                  )}
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className={picoSoft('p-4')}>
                  <p className={picoClasses.label}>
                    {tt('hero.runState.label', 'Run state')}
                  </p>
                  <p className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    {heroRunSignal}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    {latestRunTimestamp
                      ? formatTimestamp(latestRunTimestamp)
                      : tt('hero.runState.triggerTaskFirst', 'trigger a real task first')}
                  </p>
                </div>

                <div className={picoSoft('p-4')}>
                  <p className={picoClasses.label}>
                    {tt('hero.budgetLine.label', 'Budget line')}
                  </p>
                  <p className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    {heroBudgetSignal}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    {budget
                      ? tt('hero.budgetLine.threshold', 'threshold {percent}', {
                          percent: formatPercent(progress.autopilot.costThresholdPercent),
                        })
                      : tt('hero.budgetLine.waitingForSpend', 'waiting for live spend')}
                  </p>
                </div>

                <div className={picoSoft('p-4')}>
                  <p className={picoClasses.label}>
                    {tt('hero.gateState.label', 'Gate state')}
                  </p>
                  <p className="mt-2 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    {heroGateSignal}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    {progress.autopilot.approvalGateEnabled
                      ? tt('hero.gateState.reviewVisible', 'human review stays visible')
                      : tt('hero.gateState.enableBeforeRisk', 'enable before risky action')}
                  </p>
                </div>
              </div>

              <div className={picoInset('grid gap-3 p-4 sm:grid-cols-[auto,minmax(0,1fr)] sm:items-center')}>
                <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-[rgba(var(--pico-accent-rgb),0.24)] bg-[linear-gradient(180deg,rgba(var(--pico-accent-rgb),0.18),rgba(7,13,8,0.5))] shadow-[0_18px_40px_rgba(var(--pico-accent-rgb),0.12)]">
                  <span className="h-3 w-3 rounded-full bg-[color:var(--pico-accent-bright)] shadow-[0_0_18px_rgba(var(--pico-accent-rgb),0.5)]" />
                </div>
                <div className="min-w-0">
                  <p className={picoClasses.label}>
                    {tt('hero.nextCheck.label', 'Next operator check')}
                  </p>
                  <p className="mt-2 font-[family:var(--font-site-display)] text-2xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                    {latestRun
                      ? tt('hero.nextCheck.inspectRun', 'Inspect run {runId}', {
                          runId: latestRun.id.slice(0, 8),
                        })
                      : tt('hero.nextCheck.createFirstRun', 'Create the first live run')}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                    {latestRun
                      ? describeRunDetail(latestRun, latestRunTraces)
                      : tt(
                          'hero.nextCheck.noRunBody',
                          'No run is visible yet, so the honest move is still back on the lesson path.',
                        )}
                  </p>
                </div>
              </div>
            </div>

            <div className={picoInset('grid gap-4 overflow-hidden border-[color:rgba(var(--pico-accent-rgb),0.24)] bg-[radial-gradient(circle_at_50%_20%,rgba(var(--pico-accent-rgb),0.16),rgba(6,11,7,0.94)_54%,rgba(3,5,3,0.98)_100%)] p-4')}>
              <div className={picoSoft('p-4')}>
                <p className={picoClasses.label}>{tt('hero.packet.label', 'Control packet')}</p>
                <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  <code>{autopilotPacketPreview}</code>
                </pre>
              </div>
              <div className={picoSoft('p-4')}>
                <p className={picoClasses.label}>
                  {tt('hero.decisionLine.label', 'Decision line')}
                </p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {thresholdBreached
                    ? tt(
                        'hero.decisionLine.thresholdBreached',
                        'Spend is already across the line. Decide whether the next risky action needs a human gate.',
                      )
                    : pendingApprovals.length > 0
                      ? tt(
                          'hero.decisionLine.pendingQueue',
                          'The queue is holding risky actions in view. Review them before the surface gets noisier.',
                        )
                      : tt(
                          'hero.decisionLine.clear',
                          'If the line is still clear, keep reading the run until the next decision becomes obvious.',
                        )}
                </p>
              </div>
            </div>
          </div>
        </div>
      }
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
        title={tt(
          'surfaceCompass.title',
          'Stay here only when the live runtime is the real source of truth',
        )}
        body={tt(
          'surfaceCompass.body',
          'Autopilot is for reading the current run, spend, alerts, and approvals. If the product still needs a lesson answer, go back to academy or tutor. If the runtime truth is visible but still not enough, escalate with the evidence attached.',
        )}
        status={
          authRequired
            ? tt('surfaceCompass.status.hostedSessionRequired', 'hosted session required')
            : latestRun
              ? tt('surfaceCompass.status.runtimeVisible', 'runtime visible')
              : tt('surfaceCompass.status.waitingForFirstRun', 'waiting for first run')
        }
        aside={tt(
          'surfaceCompass.aside',
          'A control room should not ask for faith. If there is no live signal, leave and create one. If the signal exists, use it to decide the next move immediately.',
        )}
        items={[
          {
            href: localizedNextLesson
              ? toHref(`/academy/${localizedNextLesson.slug}`)
              : toHref('/academy'),
            label: localizedNextLesson
              ? tt('surfaceCompass.items.finishLesson', 'Finish {lessonTitle}', {
                  lessonTitle: localizedNextLesson.title,
                })
              : tt('surfaceCompass.items.goBackToAcademy', 'Go back to academy'),
            caption: tt(
              'surfaceCompass.items.lessonCaption',
              'Return here when the real blocker is still on the lesson path rather than in the runtime.',
            ),
            note: tt('surfaceCompass.items.backToLaneNote', 'Back to lane'),
          },
          {
            href: toHref(`/tutor${localizedNextLesson ? `?lesson=${localizedNextLesson.slug}` : ''}`),
            label: tt('surfaceCompass.items.askTutor', 'Ask tutor about the next move'),
            caption: tt(
              'surfaceCompass.items.askTutorCaption',
              'Use tutor when the product likely still knows the answer and the issue is not live runtime state.',
            ),
            note: tt('surfaceCompass.items.askTutorNote', 'Knowable'),
          },
          {
            href: '#recent-runs',
            label: tt('surfaceCompass.items.stayOnRecentRuns', 'Stay on recent runs'),
            caption: tt(
              'surfaceCompass.items.stayOnRecentRunsCaption',
              'Remain here when the latest execution, trace, or alert feed is the actual decision surface.',
            ),
            note: tt('surfaceCompass.items.stayHereNote', 'Stay here'),
            tone: 'primary',
          },
          {
            href: toHref('/support'),
            label: tt(
              'surfaceCompass.items.escalateWithEvidence',
              'Escalate with evidence',
            ),
            caption: tt(
              'surfaceCompass.items.escalateCaption',
              'Escalate only after you have the packet, the run context, and the live signal that proves where the truth broke.',
            ),
            note: tt('surfaceCompass.items.messyEdgeNote', 'Messy edge'),
            tone: 'soft',
          },
        ]}
      />

      {authRequired ? (
        <div className="mb-6 rounded-[28px] border border-amber-400/20 bg-amber-400/10 p-6 text-sm leading-6 text-amber-50">
          {tt(
            'banner.authRequired',
            'Live Autopilot needs an authenticated MUTX session. Until then, there is no honest run, alert, budget, or approval feed to show you.',
          )}
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
                <p className={picoClasses.label}>
                  {tt('operatorDoctrine.sectionLabel', 'Operator doctrine')}
                </p>
                <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[color:var(--pico-text)]">
                  {tt('operatorDoctrine.title', 'Read, judge, then intervene')}
                </h2>
              </div>
              <span className={picoClasses.chip}>
                {tt('operatorDoctrine.chip', 'signal • line • gate')}
              </span>
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
              <p className={picoClasses.label}>
                {tt('operatorDoctrine.postureLabel', 'Control room posture')}
              </p>
              <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                {tt(
                  'operatorDoctrine.postureBody',
                  'Use this room to review live state, not to celebrate movement for its own sake.',
                )}
              </p>
            </div>

            <div className={picoInset('p-5')}>
              <p className={picoClasses.label}>
                {tt('operatorDoctrine.decisionLineLabel', 'Decision line')}
              </p>
              <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                {tt(
                  'operatorDoctrine.decisionLineBody',
                  'Start with the last run, compare it against the budget line, then decide whether the gate needs a human call. That order matters.',
                )}
              </p>
            </div>

            <div className={picoInset('p-4')}>
              <p className={picoClasses.label}>
                {tt('operatorDoctrine.operatorCuesLabel', 'Operator cues')}
              </p>
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
              <p className={picoClasses.label}>
                {tt('controlBrief.sectionLabel', 'Control brief')}
              </p>
              <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.06em] text-[color:var(--pico-text)] sm:text-5xl">
                {tt(
                  'controlBrief.title',
                  'Read the runtime before you trust the automation',
                )}
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[color:var(--pico-text-secondary)] sm:text-base">
                {tt(
                  'controlBrief.body',
                  'Autopilot earns trust when the last run, the live spend, and the risky actions stay visible in one control surface.',
                )}
              </p>

              <div className={picoEmber('mt-6 p-5')}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={picoClasses.chip}>{loadStateLabel}</span>
                  <span className={picoClasses.chip}>
                    {authRequired
                      ? tt(
                          'controlBrief.chip.hostedSessionRequired',
                          'Hosted session required',
                        )
                      : tt('controlBrief.chip.liveFeed', 'Live control-plane feed')}
                  </span>
                  <span className={picoClasses.chip}>
                    {progress.autopilot.approvalGateEnabled
                      ? tt('controlBrief.chip.gateConfigured', 'Gate configured in Pico')
                      : tt('controlBrief.chip.gateOff', 'Gate still off in Pico')}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-[color:var(--pico-text-secondary)]">
                  {authRequired
                    ? tt(
                        'controlBrief.summary.authRequired',
                        'Until a MUTX session is attached, this surface refuses to invent truth. Use the academy to finish the setup path, then come back to read the real runtime.',
                      )
                    : latestRun
                      ? tt(
                          'controlBrief.summary.withRun',
                          'Latest run {runId} is {status}{asOfClause}. {detail}',
                          {
                            runId: latestRun.id.slice(0, 8),
                            status: humanizeRunStatus(latestRun.status).toLowerCase(),
                            asOfClause: latestRunTimestamp
                              ? tt('controlBrief.summary.withRunAsOf', ' as of {timestamp}', {
                                  timestamp: formatTimestamp(latestRunTimestamp),
                                })
                              : '',
                            detail: describeRunDetail(latestRun, latestRunTraces),
                          },
                        )
                      : tt(
                          'controlBrief.summary.noRun',
                          'No live run is visible yet. The next honest move is to finish the academy path, trigger one real task, and return here only once the runtime has something to say.',
                        )}
                </p>
              </div>

            </div>

            <div className="border-t border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] p-6 lg:border-l lg:border-t-0">
              <p className={picoClasses.label}>
                {tt('operatorRail.sectionLabel', 'Operator rail')}
              </p>
              <div className="mt-4 grid gap-3">
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">
                    {tt('operatorRail.sessionStatusLabel', 'Session status')}
                  </p>
                  <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                    {authRequired
                      ? tt('operatorRail.sessionStatus.authRequired', 'auth required')
                      : tt('operatorRail.sessionStatus.attached', 'attached')}
                  </p>
                </div>
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">
                    {tt('operatorRail.progressSyncLabel', 'Progress sync')}
                  </p>
                  <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                    {syncStateLabel(syncState)}
                  </p>
                </div>
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">
                    {tt('operatorRail.budgetLineLabel', 'Budget line')}
                  </p>
                  <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                    {formatPercent(progress.autopilot.costThresholdPercent)}
                  </p>
                </div>
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">
                    {tt('operatorRail.gateStateLabel', 'Gate state')}
                  </p>
                  <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                    {progress.autopilot.approvalGateEnabled
                      ? tt('operatorRail.gateState.enabled', 'enabled')
                      : tt('operatorRail.gateState.off', 'off')}
                  </p>
                </div>
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">
                    {tt('operatorRail.activeSurfaceLabel', 'Active surface')}
                  </p>
                  <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                    {progress.platform.activeSurface ??
                      tt('operatorRail.activeSurfaceNone', 'none')}
                  </p>
                </div>
                <div className={picoSoft('p-4')}>
                  <p className="text-sm text-[color:var(--pico-text-muted)]">
                    {tt('operatorRail.helpLaneLabel', 'Help lane')}
                  </p>
                  <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                    {progress.platform.helpLaneOpen
                      ? tt('operatorRail.helpLane.open', 'open')
                      : tt('operatorRail.helpLane.closed', 'closed')}
                  </p>
                </div>
              </div>

              <div className={picoInset('mt-4 p-4')}>
                <p className={picoClasses.label}>
                  {tt('operatorRail.jumpToSubsystem', 'Jump to subsystem')}
                </p>
                <div className="mt-3 grid gap-2">
                  <Link href="#timeline-section" className={picoClasses.secondaryButton}>
                    {tt('operatorRail.jump.timeline', 'Timeline')}
                  </Link>
                  <Link href="#recent-runs" className={picoClasses.tertiaryButton}>
                    {tt('operatorRail.jump.recentRuns', 'Recent runs')}
                  </Link>
                  <Link href="#alerts-section" className={picoClasses.tertiaryButton}>
                    {tt('operatorRail.jump.alerts', 'Alerts')}
                  </Link>
                  <Link href="#approvals-section" className={picoClasses.tertiaryButton}>
                    {tt('operatorRail.jump.approvalQueue', 'Approval queue')}
                  </Link>
                </div>
              </div>

              <div className={picoInset('mt-4 p-4')}>
                <p className={picoClasses.label}>
                  {tt('operatorRail.emptyFeedLabel', 'If the feed is empty')}
                </p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {tt(
                    'operatorRail.emptyFeedBody',
                    'Do not dress up missing runtime data. Finish the academy path, trigger one real action, and come back only when MUTX has something to report.',
                  )}
                </p>
                <Link
                  href={localizedNextLesson ? toHref(`/academy/${localizedNextLesson.slug}`) : toHref('/academy')}
                  className={cn(picoClasses.secondaryButton, 'mt-4')}
                >
                  {localizedNextLesson
                    ? tt('shared.action.openLesson', 'Open {lessonTitle}', {
                        lessonTitle: localizedNextLesson.title,
                      })
                    : tt('shared.action.returnToAcademy', 'Return to academy')}
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-t border-[color:var(--pico-border)] p-6 md:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label={tt('stats.runs.label', 'Runs')}
              value={liveValue(String(runs.length))}
              hint={liveHint(
                !integrationStatus.hasLiveAgent
                  ? tt('stats.runs.noAgent', 'No agent is connected to MUTX yet.')
                  : runs.length > 0
                    ? tt('stats.runs.hasRuns', 'Recent executions pulled from MUTX.')
                    : tt('stats.runs.noRunsYet', 'An agent exists, but no run has landed yet.'),
                tt('stats.runs.offline', 'Sign in to read live run history.'),
              )}
            />
            <StatCard
              label={tt('stats.failures.label', 'Failures')}
              value={liveValue(String(failedRuns.length))}
              hint={liveHint(
                failedRuns.length > 0
                  ? tt(
                      'stats.failures.hasFailures',
                      'Failures are visible here. Good. Hidden failures are worse.',
                    )
                  : tt('stats.failures.none', 'No failed runs in the current window.'),
                tt('stats.failures.offline', 'Sign in to see failed run count.'),
              )}
            />
            <StatCard
              label={tt('stats.alerts.label', 'Alerts')}
              value={liveValue(String(alerts.filter((alert) => !alert.resolved).length))}
              hint={liveHint(
                alerts.some((alert) => !alert.resolved)
                  ? tt(
                      'stats.alerts.hasAlerts',
                      'Unresolved operator pain from the monitoring feed.',
                    )
                  : integrationStatus.hasRuns
                    ? tt('stats.alerts.noneWithRuns', 'No unresolved alerts right now.')
                    : tt('stats.alerts.noneNoRuns', 'No alerts yet because nothing has executed.'),
                tt('stats.alerts.offline', 'Sign in to read live alerts.'),
              )}
            />
            <StatCard
              label={tt('stats.budget.label', 'Budget')}
              value={liveValue(budget ? formatPercent(budget.usage_percentage) : '--')}
              hint={liveHint(
                !integrationStatus.hasBudget
                  ? tt('stats.budget.noSnapshot', 'No live budget snapshot returned yet.')
                  : integrationStatus.hasUsage
                    ? tt('stats.budget.hasUsage', '{threshold} threshold against live spend.', {
                        threshold: formatPercent(progress.autopilot.costThresholdPercent),
                      })
                    : tt('stats.budget.noUsage', 'Budget exists, but usage is empty in the current window.'),
                tt('stats.budget.offline', 'Sign in to read budget usage.'),
              )}
            />
            <StatCard
              label={tt('stats.approvals.label', 'Approvals')}
              value={liveValue(String(pendingApprovals.length))}
              hint={liveHint(
                pendingApprovals.length > 0
                  ? tt(
                      'stats.approvals.pending',
                      'Pending risky actions are waiting for a human call.',
                    )
                  : integrationStatus.hasApprovalRecords && !integrationStatus.approvalGateConfigured
                    ? tt(
                        'stats.approvals.historyGateOff',
                        'Approval history exists, but Pico gate is still off locally.',
                      )
                    : tt('stats.approvals.none', 'No risky actions are blocked right now.'),
                tt('stats.approvals.offline', 'Sign in to see live approvals.'),
              )}
            />
          </div>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <section className={picoPanel('p-5')}>
            <p className={picoClasses.label}>
              {tt('controlBrief.sectionLabel', 'Control brief')}
            </p>
            <div className="mt-4 grid gap-3">
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">
                  {tt('sidebar.latestRunLabel', 'Latest run')}
                </p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {authRequired
                    ? tt('sidebar.latestRun.unavailable', 'unavailable')
                    : latestRun
                      ? humanizeRunStatus(latestRun.status).toLowerCase()
                      : tt('sidebar.latestRun.noneYet', 'none yet')}
                </p>
              </div>
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">
                  {tt('sidebar.thresholdLineLabel', 'Threshold line')}
                </p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {thresholdBreached
                    ? tt('sidebar.thresholdLine.breached', 'breached')
                    : tt('sidebar.thresholdLine.clear', 'clear')}
                </p>
              </div>
              {localizedNextLesson ? (
                <>
                  <div className={picoInset('p-4')} data-testid="pico-autopilot-academy-context">
                    <p className="text-sm text-[color:var(--pico-text-muted)]">
                      {tt('sidebar.recoveryLessonLabel', 'Recovery lesson')}
                    </p>
                    <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                      {localizedNextLesson.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      {tt('sidebar.stepsProgress', '{completed}/{total} steps', {
                        completed: recoveryWorkspace.completedStepCount,
                        total: localizedNextLesson.steps.length,
                      })}
                    </p>
                    <p className="mt-2 text-sm font-medium text-[color:var(--pico-text)]">
                      {recoveryWorkspace.workspace.evidence.trim()
                        ? tt('sidebar.evidence.captured', 'captured')
                        : tt('sidebar.evidence.missing', 'missing')}
                    </p>
                  </div>
                  <div className={picoInset('p-4')}>
                    <p className="text-sm text-[color:var(--pico-text-muted)]">
                      {tt('sidebar.workspaceProofLabel', 'Workspace proof')}
                    </p>
                    <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                      {recoveryWorkspace.workspace.evidence.trim()
                        ? tt('sidebar.evidence.captured', 'captured')
                        : tt('sidebar.evidence.missing', 'missing')}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      {tt(
                        'sidebar.stepsWithFocus',
                        '{completed}/{total} steps • {stepTitle}',
                        {
                          completed: recoveryWorkspace.completedStepCount,
                          total: localizedNextLesson.steps.length,
                          stepTitle: recoveryFocusedStep,
                        },
                      )}
                    </p>
                  </div>
                </>
              ) : null}
            </div>
            <div className="mt-4 grid gap-3">
              <a
                href={localizedNextLesson ? toHref(`/academy/${localizedNextLesson.slug}`) : toHref('/academy')}
                className={picoClasses.secondaryButton}
              >
                {localizedNextLesson
                  ? tt('shared.action.openLesson', 'Open {lessonTitle}', {
                      lessonTitle: localizedNextLesson.title,
                    })
                  : tt('shared.action.returnToAcademy', 'Return to academy')}
              </a>
              <a
                href={toHref(`/tutor${localizedNextLesson ? `?lesson=${localizedNextLesson.slug}` : ''}`)}
                className={picoClasses.tertiaryButton}
              >
                {tt('sidebar.askTutor', 'Ask tutor about the next move')}
              </a>
              <a href={toHref('/support')} className={picoClasses.tertiaryButton}>
                {tt('sidebar.escalateHumanHelp', 'Escalate to human help')}
              </a>
            </div>
            <div className={picoSoft('mt-4 p-4')}>
              <p className={picoClasses.body}>
                {tt(
                  'sidebar.body',
                  'Stay here when the runtime is the source of truth. If the lesson workspace is still incomplete, the academy remains the cleaner route back to a real answer.',
                )}
              </p>
            </div>
          </section>
        </aside>
      </section>

      <section className={picoPanel('mt-6 p-6 sm:p-7')} data-testid="pico-autopilot-control-protocol">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className={picoClasses.label}>
              {tt('controlProtocol.sectionLabel', 'Control protocol')}
            </p>
            <h2 className="mt-3 font-[family:var(--font-site-display)] text-3xl tracking-[-0.05em] text-[color:var(--pico-text)] sm:text-4xl">
              {tt(
                'controlProtocol.title',
                'Three operator checks before automation earns trust',
              )}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--pico-text-secondary)]">
              {tt(
                'controlProtocol.body',
                'The control room should stage the first decisions in plain sight. Read the last run, read the spend line, and keep risky actions exposed before you touch anything more abstract.',
              )}
            </p>
          </div>
          <span className={picoClasses.chip}>
            {tt('controlProtocol.chip', 'live operator checklist')}
          </span>
        </div>

        <div className={storyRailClass}>
          {controlProtocol.map((item) => (
            <article key={item.id} className={picoInset('snap-start flex h-full flex-col p-5 sm:p-6')}>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[color:var(--pico-border)] bg-[rgba(var(--pico-accent-rgb),0.12)] text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--pico-accent)]">
                  {item.id}
                </span>
                <span className={picoClasses.label}>
                  {tt('controlProtocol.cardLabel', 'Operator check')}
                </span>
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
                <p className={picoClasses.label}>
                  {tt('timeline.sectionLabel', 'Signal narrative')}
                </p>
                <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                  {tt(
                    'timeline.title',
                    'Read the live story before you touch settings',
                  )}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {tt(
                    'timeline.body',
                    'This is the operator narrative. If the timeline is empty, the correct answer is that nothing meaningful has happened yet.',
                  )}
                </p>
              </div>
              <span className={picoClasses.chip}>{loadStateLabel}</span>
            </div>
            <div className="mt-5 space-y-4">
              {authRequired ? (
                <div className="rounded-[24px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] p-5 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {tt(
                    'timeline.authRequired',
                    'No timeline without live control-plane access. That is the honest answer.',
                  )}
                </div>
              ) : timeline.length === 0 ? (
                <EmptyStatePanel state={runEmptyState} />
              ) : (
                <>
                  {visibleTimeline.map((item) => (
                    <TimelineItemCard
                      key={item.id}
                      item={item}
                      formatTimestamp={formatTimestamp}
                      formatRelativeTime={formatRelativeTime}
                      whyItMattersLabel={timelineWhyItMattersLabel}
                      jumpLabel={timelineJumpLabel}
                    />
                  ))}
                  {timeline.length > visibleTimeline.length ? (
                    <div className={picoSoft('p-4')}>
                      <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                        {tt(
                          'timeline.olderSignalsHidden',
                          '{count} older signal{pluralSuffix} stayed out of view on purpose. Start with the strongest four.',
                          {
                            count: timeline.length - visibleTimeline.length,
                            pluralSuffix:
                              timeline.length - visibleTimeline.length === 1 ? '' : 's',
                          },
                        )}
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
                <p className={picoClasses.label}>
                  {tt('runs.sectionLabel', 'Run review')}
                </p>
                <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.05em] text-[color:var(--pico-text)]">
                  {tt('runs.title', 'Recent execution review')}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {tt(
                    'runs.body',
                    'Start here. Read the latest run before you touch thresholds or approvals.',
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void load()}
                className={picoClasses.secondaryButton}
              >
                {tt('runs.refresh', 'Refresh live data')}
              </button>
            </div>
            <div className="mt-5 space-y-4">
              {authRequired ? (
                <div className="rounded-[24px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] p-5 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {tt(
                    'runs.authRequired',
                    'Sign in, then come back here to inspect the first real run.',
                  )}
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
                            {tt('runs.card.title', 'Run {runId}', { runId: run.id.slice(0, 8) })}
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
                          <p className={picoClasses.label}>
                            {tt('runs.card.operatorReadLabel', 'Operator read')}
                          </p>
                          <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                            {['FAILED', 'ERROR', 'CANCELLED'].includes(run.status.toUpperCase())
                              ? tt(
                                  'runs.card.operatorRead.failed',
                                  'This job failed. If the agent is still trusted, it should be because you understand this failure.',
                                )
                              : ['RUNNING', 'QUEUED', 'PENDING'].includes(run.status.toUpperCase())
                                ? tt(
                                    'runs.card.operatorRead.active',
                                    'This work is still active. Long silence means you may have a stuck runtime.',
                                  )
                                : tt(
                                    'runs.card.operatorRead.finished',
                                    'The job finished. Now verify the output is useful, not just technically complete.',
                                  )}
                          </p>
                        </div>

                        <div className={picoInset('p-4')}>
                          <p className={picoClasses.label}>
                            {tt('runs.card.factsLabel', 'Run facts')}
                          </p>
                          <div className="mt-3 grid gap-2 text-sm text-[color:var(--pico-text-secondary)]">
                            <p>
                              {tt('runs.card.agent', 'Agent: {agentId}', {
                                agentId: run.agent_id ?? tt('runs.card.agentUnknown', 'unknown'),
                              })}
                            </p>
                            <p>
                              {tt('runs.card.traceCount', 'Trace count: {count}', {
                                count: run.trace_count ?? traces.length,
                              })}
                            </p>
                            <p>
                              {run.started_at
                                ? tt('runs.card.started', 'Started {timestamp}', {
                                    timestamp: formatTimestamp(run.started_at),
                                  })
                                : tt('runs.card.startUnavailable', 'Start time unavailable')}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className={picoInset('mt-4 p-4')}>
                        <p className={picoClasses.label}>
                          {tt('runs.card.traceSignalsLabel', 'Trace signals')}
                        </p>
                        {traces.length === 0 ? (
                          <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                            {tt('runs.card.noTraces', 'No run traces were returned for this run.')}
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
                        {tt(
                          'runs.olderRunsHidden',
                          '{count} older run{pluralSuffix} are hidden so the review stays on the latest decisions first.',
                          {
                            count: runs.length - visibleRuns.length,
                            pluralSuffix: runs.length - visibleRuns.length === 1 ? '' : 's',
                          },
                        )}
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
            <p className={picoClasses.label}>
              {tt('spend.sectionLabel', 'Spend review')}
            </p>
            <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.05em] text-[color:var(--pico-text)]">
              {tt('spend.title', 'Live spend and your line in the sand')}
            </h2>

            <div className="mt-5 grid gap-4">
              <div className={picoInset('p-5')}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={picoClasses.label}>{tt('spend.usageLabel', 'Usage')}</p>
                    <p className="mt-3 font-[family:var(--font-site-display)] text-5xl tracking-[-0.06em] text-[color:var(--pico-text)]">
                      {authRequired ? '--' : budget ? formatPercent(budget.usage_percentage) : '--'}
                    </p>
                  </div>
                  <span className={picoClasses.chip}>
                    {thresholdBreached
                      ? tt('spend.thresholdStatus.above', 'above threshold')
                      : tt('spend.thresholdStatus.within', 'within threshold')}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {authRequired
                    ? tt('spend.summary.authRequired', 'Live budget requires authentication.')
                    : budget
                      ? tt('spend.summary.withBudget', '{used} used of {total}. Reset {reset}.', {
                          used: budget.credits_used,
                          total: budget.credits_total,
                          reset: budget.reset_date
                            ? formatTimestamp(budget.reset_date)
                            : tt('spend.summary.resetUnknown', 'unknown'),
                        })
                      : tt('spend.summary.noSnapshot', 'No live budget snapshot returned.')}
                </p>
              </div>

              <div className={picoSoft('p-5')}>
                <p className={picoClasses.label}>{tt('spend.thresholdLabel', 'Threshold')}</p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {tt(
                    'spend.thresholdBody',
                    'Pico stores the local budget line here. Real alert delivery still follows the live MUTX monitoring setup, so this surface refuses to pretend email or webhook routing is active when it is not.',
                  )}
                </p>

                <label className="mt-4 block text-sm text-[color:var(--pico-text-secondary)]">
                  <span className="block text-xs uppercase tracking-[0.24em] text-[color:var(--pico-text-muted)]">
                    {tt('spend.thresholdInputLabel', 'Cost threshold percent')}
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
                    {tt('spend.saveThreshold', 'Save threshold')}
                  </button>
                  <span className={picoClasses.chip}>
                    {tt('spend.sync', 'sync {state}', { state: syncStateLabel(syncState) })}
                  </span>
                </div>

                {thresholdValidationError ? (
                  <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-50">
                    {thresholdValidationError}
                  </div>
                ) : null}
                {thresholdBreached ? (
                  <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-50">
                    {tt(
                      'spend.breachedWarning',
                      'Threshold breached. Live usage is above the limit you configured.',
                    )}
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4">
                <div className={picoInset('p-4')}>
                  <p className={picoClasses.label}>
                    {tt('spend.topSpendersLabel', 'Top spenders')}
                  </p>
                  <div className="mt-3 grid gap-2">
                    {authRequired ? (
                      <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                        {tt('spend.breakdownAuthRequired', 'Sign in to read the usage breakdown.')}
                      </p>
                    ) : usage?.usage_by_agent.length ? (
                      usage.usage_by_agent.slice(0, 3).map((item) => (
                        <div key={`${item.agent_id}-${item.agent_name}`} className={picoSoft('px-4 py-3')}>
                          <p className="font-medium text-[color:var(--pico-text)]">{item.agent_name}</p>
                          <p className="mt-1 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                            {tt('spend.breakdownRow', '{credits} credits across {events} events', {
                              credits: item.credits_used,
                              events: item.event_count,
                            })}
                          </p>
                        </div>
                      ))
                    ) : (
                      <EmptyStatePanel state={usageEmptyState} />
                    )}
                  </div>
                </div>

                <div className={picoInset('p-4')}>
                  <p className={picoClasses.label}>
                    {tt('spend.usageDriversLabel', 'Usage drivers')}
                  </p>
                  <div className="mt-3 grid gap-2">
                    {authRequired ? (
                      <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                        {tt('spend.breakdownAuthRequired', 'Sign in to read the usage breakdown.')}
                      </p>
                    ) : usage?.usage_by_type.length ? (
                      usage.usage_by_type.slice(0, 3).map((item) => (
                        <div key={item.event_type} className={picoSoft('px-4 py-3')}>
                          <p className="font-medium text-[color:var(--pico-text)]">{item.event_type}</p>
                          <p className="mt-1 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                            {tt('spend.breakdownRow', '{credits} credits across {events} events', {
                              credits: item.credits_used,
                              events: item.event_count,
                            })}
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
            <p className={picoClasses.label}>{tt('alerts.sectionLabel', 'Alerts')}</p>
            <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.05em] text-[color:var(--pico-text)]">
              {tt('alerts.title', 'Meaningful monitoring events')}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
              {tt(
                'alerts.body',
                'This is the live alert feed. No fake warning badges, no synthetic incidents.',
              )}
            </p>

            <div className="mt-5 space-y-4">
              {authRequired ? (
                <div className="rounded-[24px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] p-5 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {tt('alerts.authRequired', 'Sign in to load live alerts.')}
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
                            {alert.resolved
                              ? tt('alerts.card.resolvedTitle', 'Resolved alert')
                              : tt('alerts.card.activeTitle', 'Active alert')}
                          </h3>
                        </div>
                        <div className="text-right text-xs uppercase tracking-[0.18em] text-[color:var(--pico-text-secondary)]">
                          <p>{formatTimestamp(alert.resolved_at ?? alert.created_at)}</p>
                          <p className="mt-1">{formatRelativeTime(alert.resolved_at ?? alert.created_at)}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-6">{alert.message}</p>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-[color:var(--pico-text-secondary)]">
                        <span>
                          {tt('alerts.card.agent', 'Agent: {agentId}', {
                            agentId: alert.agent_id,
                          })}
                        </span>
                        <span>
                          {alert.resolved
                            ? tt('alerts.card.resolvedStatus', 'Resolved')
                            : tt('alerts.card.activeStatus', 'Still active')}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                        {tt('shared.label.whyItMatters', 'Why it matters: {impact}', {
                          impact: explainAlertImpact(alert),
                        })}
                      </p>
                    </article>
                  ))}
                  {alerts.length > visibleAlerts.length ? (
                    <div className={picoSoft('p-4')}>
                      <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                        {tt(
                          'alerts.hiddenCount',
                          '{count} additional alert{pluralSuffix} are suppressed so the feed stays editorial instead of turning into a wall of badges.',
                          {
                            count: alerts.length - visibleAlerts.length,
                            pluralSuffix:
                              alerts.length - visibleAlerts.length === 1 ? '' : 's',
                          },
                        )}
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
          <p className={picoClasses.label}>
            {tt('approvals.sectionLabel', 'Approvals')}
          </p>
          <h2 className="mt-3 font-[family:var(--font-site-display)] text-4xl tracking-[-0.05em] text-[color:var(--pico-text)]">
            {tt('approvals.title', 'Risky actions and their decisions')}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
            {tt(
              'approvals.body',
              'This queue is now the approval source of truth for Pico. It should not disappear because a process restarted.',
            )}
          </p>

          <div className="mt-5 space-y-4">
            {authRequired ? (
              <div className="rounded-[24px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] p-5 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                {tt('approvals.authRequired', 'Sign in to load live approval requests.')}
              </div>
            ) : (
              <>
                {pendingApprovals.length === 0 && resolvedApprovals.length === 0 ? (
                  <EmptyStatePanel state={approvalsEmptyState} />
                ) : null}

                {integrationStatus.hasApprovalRecords && !integrationStatus.approvalGateConfigured ? (
                  <div className="rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-5 text-sm leading-6 text-amber-50">
                    {tt(
                      'approvals.gateMismatch',
                      'Approval records already exist in MUTX, but Pico still shows the gate as off locally. Turn on the gate here so the product state matches the control-plane reality.',
                    )}
                  </div>
                ) : null}

                {visiblePendingApprovals.map((approval) => (
                  <article key={approval.id} className={`rounded-[24px] border p-5 ${severityClasses('warn')}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em]">
                          {tt('approvals.card.pendingLabel', 'Pending')}
                        </p>
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
                        : tt(
                            'approvals.card.fallbackSummary',
                            '{requester} requested this action for agent {agentId}.',
                            {
                              requester: approval.requester,
                              agentId: approval.agent_id,
                            },
                          )}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      {tt('shared.label.whyItMatters', 'Why it matters: {impact}', {
                        impact: explainApprovalImpact(approval),
                      })}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => void resolveApproval(approval.id, 'approve')}
                        disabled={resolvingApprovalId === approval.id}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--pico-accent)] px-4 py-2 text-sm font-semibold text-[color:var(--pico-accent-contrast)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {resolvingApprovalId === approval.id
                          ? tt('approvals.card.working', 'Working...')
                          : tt('approvals.card.approve', 'Approve')}
                      </button>
                      <button
                        type="button"
                        onClick={() => void resolveApproval(approval.id, 'reject')}
                        disabled={resolvingApprovalId === approval.id}
                        className="rounded-full border border-[color:var(--pico-border)] px-4 py-2 text-sm font-medium text-[color:var(--pico-text-secondary)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {resolvingApprovalId === approval.id
                          ? tt('approvals.card.working', 'Working...')
                          : tt('approvals.card.reject', 'Reject')}
                      </button>
                    </div>
                  </article>
                ))}
                {pendingApprovals.length > visiblePendingApprovals.length ? (
                  <div className={picoSoft('p-4')}>
                    <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      {tt(
                        'approvals.hiddenPending',
                        '{count} more pending approval{pluralSuffix} stayed out of view so the queue keeps the sharpest decisions on top.',
                        {
                          count: pendingApprovals.length - visiblePendingApprovals.length,
                          pluralSuffix:
                            pendingApprovals.length - visiblePendingApprovals.length === 1
                              ? ''
                              : 's',
                        },
                      )}
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
                <p className={picoClasses.label}>
                  {tt('composer.sectionLabel', 'Create a gated action')}
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                  {tt(
                    'composer.body',
                    'Exercise the live approval queue here instead of waiting for another surface to create the request first.',
                  )}
                </p>
              </div>
              <span className={picoClasses.chip}>
                {tt('composer.chip', 'live queue write')}
              </span>
            </div>

            <div className="mt-4 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <label className="grid gap-2 text-sm text-[color:var(--pico-text-secondary)]">
                  <span className={picoClasses.label}>
                    {tt('composer.agentIdLabel', 'Agent ID')}
                  </span>
                  <input
                    value={approvalDraft.agentId}
                    onChange={(event) =>
                      setApprovalDraft((current) => ({ ...current, agentId: event.target.value }))
                    }
                    className="rounded-[20px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] px-4 py-3 text-[color:var(--pico-text)] outline-none placeholder:text-[color:var(--pico-text-muted)]"
                    placeholder={tt('composer.agentIdPlaceholder', 'agent-founder-lab')}
                  />
                </label>

                <label className="grid gap-2 text-sm text-[color:var(--pico-text-secondary)]">
                  <span className={picoClasses.label}>
                    {tt('composer.sessionOrRunIdLabel', 'Session or run ID')}
                  </span>
                  <input
                    value={approvalDraft.sessionId}
                    onChange={(event) =>
                      setApprovalDraft((current) => ({ ...current, sessionId: event.target.value }))
                    }
                    className="rounded-[20px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] px-4 py-3 text-[color:var(--pico-text)] outline-none placeholder:text-[color:var(--pico-text-muted)]"
                    placeholder={tt('composer.sessionOrRunIdPlaceholder', 'ses-pico-approval')}
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm text-[color:var(--pico-text-secondary)]">
                <span className={picoClasses.label}>
                  {tt('composer.actionTypeLabel', 'Action type')}
                </span>
                <input
                  value={approvalDraft.actionType}
                  onChange={(event) =>
                    setApprovalDraft((current) => ({ ...current, actionType: event.target.value }))
                  }
                  className="rounded-[20px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] px-4 py-3 text-[color:var(--pico-text)] outline-none placeholder:text-[color:var(--pico-text-muted)]"
                  placeholder={tt('composer.actionTypePlaceholder', 'OUTBOUND_SEND')}
                />
              </label>

              <label className="grid gap-2 text-sm text-[color:var(--pico-text-secondary)]">
                <span className={picoClasses.label}>
                  {tt('composer.summaryLabel', 'Why this action needs a gate')}
                </span>
                <textarea
                  value={approvalDraft.summary}
                  onChange={(event) =>
                    setApprovalDraft((current) => ({ ...current, summary: event.target.value }))
                  }
                  rows={4}
                  className="rounded-[20px] border border-[color:var(--pico-border)] bg-[color:var(--pico-bg-surface)] px-4 py-3 text-[color:var(--pico-text)] outline-none placeholder:text-[color:var(--pico-text-muted)]"
                  placeholder={tt(
                    'composer.summaryPlaceholder',
                    'Describe the risky action clearly.',
                  )}
                />
              </label>

              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => void createApprovalRequest()}
                  disabled={creatingApproval}
                  className={picoClasses.primaryButton}
                >
                  {creatingApproval
                    ? tt('composer.creating', 'Creating request...')
                    : tt('composer.create', 'Create approval request')}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setApprovalDraft({
                      agentId: latestRun?.agent_id || 'agent-founder-lab',
                      sessionId: latestRun?.id || 'ses-pico-approval',
                      actionType: 'OUTBOUND_SEND',
                      summary: approvalSummaryDefault,
                    })
                  }
                  className={picoClasses.secondaryButton}
                >
                  {tt('composer.reset', 'Reset draft')}
                </button>
              </div>
            </div>
          </section>

          <section className={picoPanel('p-5')}>
            <p className={picoClasses.label}>
              {tt('gateStatus.sectionLabel', 'Gate status')}
            </p>
            <div className="mt-4 grid gap-3">
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">
                  {tt('gateStatus.pendingActions', 'Pending actions')}
                </p>
                <p className="mt-1 text-2xl font-semibold text-[color:var(--pico-text)]">{liveValue(String(pendingApprovals.length))}</p>
              </div>
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">
                  {tt('gateStatus.decisionHistory', 'Decision history')}
                </p>
                <p className="mt-1 text-2xl font-semibold text-[color:var(--pico-text)]">{liveValue(String(resolvedApprovals.length))}</p>
              </div>
              <div className={picoSoft('p-4')}>
                <p className="text-sm text-[color:var(--pico-text-muted)]">
                  {tt('gateStatus.configuredLocally', 'Configured locally')}
                </p>
                <p className="mt-1 text-lg font-medium text-[color:var(--pico-text)]">
                  {progress.autopilot.approvalGateEnabled
                    ? tt('gateStatus.yes', 'yes')
                    : tt('gateStatus.no', 'no')}
                </p>
              </div>
            </div>
          </section>

          {resolvedApprovals.length ? (
            <section className={picoPanel('p-5')}>
              <p className={picoClasses.label}>
                {tt('recentDecisions.sectionLabel', 'Recent decisions')}
              </p>
              <div className="mt-4 grid gap-3">
                {visibleResolvedApprovals.map((approval) => (
                  <article
                    key={approval.id}
                    className={`rounded-[24px] border p-4 ${severityClasses(approval.status === 'APPROVED' ? 'good' : 'critical')}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em]">
                          {humanizeRunStatus(approval.status)}
                        </p>
                        <h3 className="mt-2 text-base font-semibold text-[color:var(--pico-text)]">{approval.action_type}</h3>
                      </div>
                      <span className={picoClasses.chip}>
                        {formatRelativeTime(approval.resolved_at ?? approval.created_at)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6">
                      {typeof approval.payload?.summary === 'string'
                        ? approval.payload.summary
                        : tt(
                            'approvals.card.fallbackSummary',
                            '{requester} requested this action for agent {agentId}.',
                            {
                              requester: approval.requester,
                              agentId: approval.agent_id,
                            },
                          )}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      {tt('shared.label.whyItMatters', 'Why it matters: {impact}', {
                        impact: explainApprovalImpact(approval),
                      })}
                    </p>
                  </article>
                ))}
                {resolvedApprovals.length > visibleResolvedApprovals.length ? (
                  <div className={picoSoft('p-4')}>
                    <p className="text-sm leading-6 text-[color:var(--pico-text-secondary)]">
                      {tt(
                        'recentDecisions.hiddenOlder',
                        '{count} older decision{pluralSuffix} are hidden so the recent record stays readable.',
                        {
                          count: resolvedApprovals.length - visibleResolvedApprovals.length,
                          pluralSuffix:
                            resolvedApprovals.length - visibleResolvedApprovals.length === 1
                              ? ''
                              : 's',
                        },
                      )}
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
