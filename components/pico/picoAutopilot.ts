export type AutopilotRunSummary = {
  id: string
  agent_id?: string
  status: string
  input_text?: string | null
  output_text?: string | null
  error_message?: string | null
  metadata?: Record<string, unknown>
  started_at?: string | null
  completed_at?: string | null
  created_at?: string | null
  trace_count?: number
}

export type AutopilotRunTrace = {
  id: string
  run_id: string
  event_type: string
  message: string
  payload?: Record<string, unknown>
  sequence?: number
  timestamp?: string | null
}

export type AutopilotAlertSummary = {
  id: string
  agent_id: string
  type: string
  message: string
  resolved: boolean
  created_at: string
  resolved_at?: string | null
}

export type AutopilotBudgetSummary = {
  plan: string
  credits_total: number
  credits_used: number
  credits_remaining: number
  usage_percentage: number
  reset_date?: string
}

export type AutopilotUsageByAgent = {
  agent_id: string
  agent_name: string
  credits_used: number
  event_count: number
}

export type AutopilotUsageByType = {
  event_type: string
  credits_used: number
  event_count: number
}

export type AutopilotUsageBreakdown = {
  total_credits_used: number
  credits_remaining: number
  credits_total: number
  period_start: string
  period_end: string
  usage_by_agent: AutopilotUsageByAgent[]
  usage_by_type: AutopilotUsageByType[]
}

export type AutopilotApprovalSummary = {
  id: string
  agent_id: string
  session_id?: string
  action_type: string
  payload?: Record<string, unknown>
  status: string
  requester: string
  approver?: string | null
  created_at: string
  resolved_at?: string | null
}

export type AutopilotTimelineItem = {
  id: string
  kind: 'run' | 'alert' | 'approval' | 'budget'
  occurredAt: string
  title: string
  detail: string
  impact: string
  severity: 'neutral' | 'good' | 'warn' | 'critical'
  href: string
  sourceLabel: string
}

function toDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function fallbackTimestamp(...values: Array<string | null | undefined>) {
  return values.find((value) => typeof value === 'string' && value.trim()) ?? new Date(0).toISOString()
}

function excerpt(value?: string | null, max = 140) {
  if (!value) return null
  const compact = value.replace(/\s+/g, ' ').trim()
  if (!compact) return null
  return compact.length <= max ? compact : `${compact.slice(0, max - 1)}...`
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function formatTimestamp(value?: string | null) {
  const date = toDate(value)
  if (!date) return 'Unknown time'

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatRelativeTime(value?: string | null, now = new Date()) {
  const date = toDate(value)
  if (!date) return 'unknown time'

  const diffMs = date.getTime() - now.getTime()
  const diffMinutes = Math.round(diffMs / 60000)
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, 'minute')
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 48) {
    return formatter.format(diffHours, 'hour')
  }

  const diffDays = Math.round(diffHours / 24)
  return formatter.format(diffDays, 'day')
}

export function formatPercent(value: number) {
  if (!Number.isFinite(value)) return '--'
  return `${Math.round(value)}%`
}

export function humanizeRunStatus(status: string) {
  return titleCase(status)
}

export function getRunSeverity(status: string): AutopilotTimelineItem['severity'] {
  const normalized = status.toUpperCase()
  if (['FAILED', 'ERROR', 'CANCELLED'].includes(normalized)) return 'critical'
  if (['RUNNING', 'QUEUED', 'PENDING'].includes(normalized)) return 'warn'
  if (['COMPLETED', 'SUCCEEDED', 'SUCCESS'].includes(normalized)) return 'good'
  return 'neutral'
}

export function describeRunDetail(run: AutopilotRunSummary, traces: AutopilotRunTrace[] = []) {
  const status = run.status.toUpperCase()
  const latestTrace = [...traces]
    .filter((trace) => typeof trace.message === 'string' && trace.message.trim())
    .sort((left, right) => new Date(right.timestamp ?? 0).getTime() - new Date(left.timestamp ?? 0).getTime())[0]

  if (['FAILED', 'ERROR', 'CANCELLED'].includes(status)) {
    return excerpt(run.error_message) ?? excerpt(latestTrace?.message) ?? 'The run stopped without a stored error message.'
  }

  if (['RUNNING', 'QUEUED', 'PENDING'].includes(status)) {
    return excerpt(latestTrace?.message) ?? 'The run is still moving through the pipeline.'
  }

  return excerpt(run.output_text) ?? excerpt(latestTrace?.message) ?? excerpt(run.input_text) ?? 'The run completed without a short summary.'
}

export function explainRunImpact(run: AutopilotRunSummary) {
  const status = run.status.toUpperCase()
  if (['FAILED', 'ERROR', 'CANCELLED'].includes(status)) {
    return 'This workflow did not finish cleanly. Check the error and traces before trusting the next attempt.'
  }

  if (['RUNNING', 'QUEUED', 'PENDING'].includes(status)) {
    return 'Work is still in flight. Watch for hangs, retries, or silence that lasts too long.'
  }

  return 'This run completed. Verify the output is actually useful before you automate it harder.'
}

export function explainAlertImpact(alert: AutopilotAlertSummary) {
  if (alert.resolved) {
    return 'The alert is cleared, but you still want the root cause to make sense.'
  }

  return 'This is active operator pain. If you ignore it, the runtime will keep surprising you.'
}

export function explainApprovalImpact(approval: AutopilotApprovalSummary) {
  const normalized = approval.status.toUpperCase()
  if (normalized === 'PENDING') {
    return 'A risky action is waiting for a human decision. Nothing should proceed past this gate yet.'
  }

  if (normalized === 'APPROVED') {
    return 'The gate opened. Make sure the approved action actually matches the request you intended to allow.'
  }

  if (normalized === 'REJECTED') {
    return 'The risky action was blocked. Good. Now decide whether the request was wrong or the guardrail is too strict.'
  }

  return 'This approval changed state and should be reviewed if it affects live behavior.'
}

export function buildAutopilotTimeline(input: {
  runs: AutopilotRunSummary[]
  alerts: AutopilotAlertSummary[]
  approvals: AutopilotApprovalSummary[]
  budget: AutopilotBudgetSummary | null
  thresholdPercent: number
  tracesByRunId?: Record<string, AutopilotRunTrace[]>
}): AutopilotTimelineItem[] {
  const timeline: AutopilotTimelineItem[] = []
  const tracesByRunId = input.tracesByRunId ?? {}

  input.runs.forEach((run) => {
    timeline.push({
      id: `run-${run.id}`,
      kind: 'run',
      occurredAt: fallbackTimestamp(run.completed_at, run.started_at, run.created_at),
      title: `${humanizeRunStatus(run.status)} run ${run.id.slice(0, 8)}`,
      detail: describeRunDetail(run, tracesByRunId[run.id] ?? []),
      impact: explainRunImpact(run),
      severity: getRunSeverity(run.status),
      href: '/dashboard/runs',
      sourceLabel: 'Runs',
    })
  })

  input.alerts.forEach((alert) => {
    timeline.push({
      id: `alert-${alert.id}`,
      kind: 'alert',
      occurredAt: fallbackTimestamp(alert.resolved_at, alert.created_at),
      title: `${titleCase(alert.type)} ${alert.resolved ? 'resolved' : 'triggered'}`,
      detail: excerpt(alert.message, 180) ?? 'Alert recorded without a message.',
      impact: explainAlertImpact(alert),
      severity: alert.resolved ? 'good' : 'critical',
      href: '/dashboard/monitoring',
      sourceLabel: 'Alerts',
    })
  })

  input.approvals.forEach((approval) => {
    const normalized = approval.status.toUpperCase()
    timeline.push({
      id: `approval-${approval.id}`,
      kind: 'approval',
      occurredAt: fallbackTimestamp(approval.resolved_at, approval.created_at),
      title: `${titleCase(approval.action_type)} ${normalized.toLowerCase()}`,
      detail: excerpt(JSON.stringify(approval.payload ?? {}), 180) ?? `Requested by ${approval.requester}.`,
      impact: explainApprovalImpact(approval),
      severity: normalized === 'PENDING' ? 'warn' : normalized === 'APPROVED' ? 'good' : normalized === 'REJECTED' ? 'critical' : 'neutral',
      href: '/pico/autopilot',
      sourceLabel: 'Approvals',
    })
  })

  if (input.budget) {
    const breached = input.budget.usage_percentage >= input.thresholdPercent
    timeline.push({
      id: 'budget-threshold',
      kind: 'budget',
      occurredAt: new Date().toISOString(),
      title: breached ? 'Budget threshold breached' : 'Budget usage in range',
      detail: `${formatPercent(input.budget.usage_percentage)} used of the current budget against a ${formatPercent(input.thresholdPercent)} threshold.`,
      impact: breached
        ? 'Spend is above the guardrail. Tighten usage or raise the threshold on purpose, not by accident.'
        : 'Budget is still under the current guardrail. Keep watching the burn before it surprises you.',
      severity: breached ? 'warn' : 'neutral',
      href: '/dashboard/budgets',
      sourceLabel: 'Budget',
    })
  }

  return timeline.sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
}
