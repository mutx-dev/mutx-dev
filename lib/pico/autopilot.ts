export type AutopilotRunSummary = {
  id: string
  status: string
  agent_id?: string | null
  started_at?: string | null
  completed_at?: string | null
  created_at?: string | null
  error_message?: string | null
  trace_count?: number | null
}

export type AutopilotRunTrace = {
  id: string
  run_id: string
  event_type: string
  message: string
  timestamp?: string | null
  sequence?: number | null
}

export type AutopilotBudgetSummary = {
  plan: string
  credits_total: number
  credits_used: number
  credits_remaining: number
  usage_percentage: number
  reset_date?: string | null
}

export type AutopilotUsageBreakdown = {
  usage_by_agent: Array<{
    agent_id: string
    agent_name: string
    credits_used: number
    event_count: number
  }>
  usage_by_type: Array<{
    event_type: string
    credits_used: number
    event_count: number
  }>
}

export type AutopilotAlertSummary = {
  id: string
  agent_id?: string | null
  type: string
  message: string
  resolved: boolean
  created_at: string
  resolved_at?: string | null
}

export type AutopilotApprovalSummary = {
  id: string
  agent_id: string
  action_type: string
  payload?: { summary?: string; [key: string]: unknown } | null
  status: string
  requester: string
  approver?: string | null
  created_at: string
  resolved_at?: string | null
}

export type AutopilotTimelineItem = {
  id: string
  occurredAt: string
  title: string
  detail: string
  impact: string
  severity: 'critical' | 'warn' | 'good' | 'neutral'
  sourceLabel: 'Run' | 'Alert' | 'Approval' | 'Budget'
  href: string
}

function safeDate(value?: string | null) {
  if (!value) return 0
  const timestamp = new Date(value).getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

function chooseRunTime(run: AutopilotRunSummary) {
  return run.completed_at ?? run.started_at ?? run.created_at ?? new Date(0).toISOString()
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

export function formatTimestamp(value?: string | null) {
  if (!value) return 'Unknown time'
  const timestamp = new Date(value)
  if (Number.isNaN(timestamp.getTime())) return 'Unknown time'
  return timestamp.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatRelativeTime(value?: string | null) {
  if (!value) return 'unknown'
  const timestamp = new Date(value).getTime()
  if (!Number.isFinite(timestamp)) return 'unknown'

  const deltaMs = Date.now() - timestamp
  const deltaMinutes = Math.round(deltaMs / 60000)
  const absoluteMinutes = Math.abs(deltaMinutes)

  if (absoluteMinutes < 1) return 'just now'
  if (absoluteMinutes < 60) return `${absoluteMinutes}m ${deltaMinutes >= 0 ? 'ago' : 'from now'}`

  const absoluteHours = Math.round(absoluteMinutes / 60)
  if (absoluteHours < 48) return `${absoluteHours}h ${deltaMinutes >= 0 ? 'ago' : 'from now'}`

  const absoluteDays = Math.round(absoluteHours / 24)
  return `${absoluteDays}d ${deltaMinutes >= 0 ? 'ago' : 'from now'}`
}

export function humanizeRunStatus(status: string) {
  return status.replace(/[_-]+/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

export function getRunSeverity(status: string): AutopilotTimelineItem['severity'] {
  const normalized = status.toUpperCase()
  if (['FAILED', 'ERROR', 'CANCELLED'].includes(normalized)) return 'critical'
  if (['RUNNING', 'QUEUED', 'PENDING'].includes(normalized)) return 'warn'
  if (['COMPLETED', 'SUCCEEDED', 'SUCCESS'].includes(normalized)) return 'good'
  return 'neutral'
}

export function describeRunDetail(run: AutopilotRunSummary, traces: AutopilotRunTrace[]) {
  if (run.error_message?.trim()) return run.error_message

  const latestTrace = [...traces]
    .sort((left, right) => safeDate(right.timestamp) - safeDate(left.timestamp))
    .find((trace) => trace.message?.trim())

  if (latestTrace?.message) return latestTrace.message

  if (['RUNNING', 'QUEUED', 'PENDING'].includes(run.status.toUpperCase())) {
    return 'The run is still active. If it stays quiet too long, assume something is stuck.'
  }

  return `Run ${humanizeRunStatus(run.status)}.`
}

export function explainAlertImpact(alert: AutopilotAlertSummary) {
  if (alert.resolved) {
    return 'The issue was resolved, which means the system recovered or someone intervened.'
  }

  if (/runtime|error|fail/i.test(alert.type) || /retry|failed|error/i.test(alert.message)) {
    return 'A live workflow is hurting. Hidden runtime failures are how trust dies.'
  }

  return 'Something triggered monitoring. Treat it as a signal to verify the runtime before trusting it.'
}

export function explainApprovalImpact(approval: AutopilotApprovalSummary) {
  if (approval.status === 'PENDING') {
    return 'This action needs a human decision before the agent crosses a risky line.'
  }

  if (approval.status === 'APPROVED') {
    return 'A human allowed this risky action, so the audit trail should justify that call.'
  }

  if (approval.status === 'REJECTED') {
    return 'A human blocked this action, which means the guardrail did its job.'
  }

  return 'This approval event changed what the agent was allowed to do.'
}

export function buildAutopilotTimeline({
  runs,
  alerts,
  approvals,
  budget,
  thresholdPercent,
  tracesByRunId,
}: {
  runs: AutopilotRunSummary[]
  alerts: AutopilotAlertSummary[]
  approvals: AutopilotApprovalSummary[]
  budget: AutopilotBudgetSummary | null
  thresholdPercent: number
  tracesByRunId: Record<string, AutopilotRunTrace[]>
}): AutopilotTimelineItem[] {
  const items: AutopilotTimelineItem[] = []

  if (budget && budget.usage_percentage >= thresholdPercent) {
    items.push({
      id: `budget-${thresholdPercent}`,
      occurredAt: new Date().toISOString(),
      title: 'Budget threshold breached',
      detail: `${formatPercent(budget.usage_percentage)} used against a ${formatPercent(thresholdPercent)} limit on the ${budget.plan} plan.`,
      impact: 'This is the line in the sand for spend. If you ignore it, cost surprises stop being surprises.',
      severity: budget.usage_percentage >= 100 ? 'critical' : 'warn',
      sourceLabel: 'Budget',
      href: '/dashboard/budgets',
    })
  }

  for (const approval of approvals) {
    items.push({
      id: `approval-${approval.id}`,
      occurredAt: approval.resolved_at ?? approval.created_at,
      title: `${approval.action_type.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())} ${approval.status.toLowerCase()}`,
      detail:
        typeof approval.payload?.summary === 'string' && approval.payload.summary.trim()
          ? approval.payload.summary
          : `${approval.requester} requested a risky action for ${approval.agent_id}.`,
      impact: explainApprovalImpact(approval),
      severity: approval.status === 'REJECTED' ? 'good' : approval.status === 'PENDING' ? 'warn' : 'neutral',
      sourceLabel: 'Approval',
      href: '/dashboard/approvals',
    })
  }

  for (const alert of alerts) {
    items.push({
      id: `alert-${alert.id}`,
      occurredAt: alert.resolved_at ?? alert.created_at,
      title: `${alert.type.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())} ${alert.resolved ? 'resolved' : 'triggered'}`,
      detail: alert.message,
      impact: explainAlertImpact(alert),
      severity: alert.resolved ? 'good' : 'critical',
      sourceLabel: 'Alert',
      href: '/dashboard/monitoring',
    })
  }

  for (const run of runs) {
    items.push({
      id: `run-${run.id}`,
      occurredAt: chooseRunTime(run),
      title: `${['FAILED', 'ERROR', 'CANCELLED'].includes(run.status.toUpperCase()) ? 'Failed run' : humanizeRunStatus(run.status)} ${run.id.slice(0, 8)}`,
      detail: describeRunDetail(run, tracesByRunId[run.id] ?? []),
      impact:
        getRunSeverity(run.status) === 'critical'
          ? 'A surprising failure landed in the execution path. Either explain it or stop pretending the runtime is trustworthy.'
          : getRunSeverity(run.status) === 'warn'
            ? 'The work is still in motion. Long silence here can mean a stuck runtime.'
            : 'The run completed. Now verify the output was actually useful.',
      severity: getRunSeverity(run.status),
      sourceLabel: 'Run',
      href: '/dashboard/runs',
    })
  }

  return items.sort((left, right) => safeDate(right.occurredAt) - safeDate(left.occurredAt))
}
