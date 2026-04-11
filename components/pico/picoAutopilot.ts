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

export type AutopilotAgentSummary = {
  id: string
  name?: string | null
  status?: string | null
  deployment_status?: string | null
  updated_at?: string | null
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

export type AutopilotIntegrationStatus = {
  hasLiveAgent: boolean
  hasRuns: boolean
  hasAlerts: boolean
  hasBudget: boolean
  hasUsage: boolean
  hasApprovalRecords: boolean
  approvalGateConfigured: boolean
}

export type AutopilotNextStep = {
  label: string
  href: string
}

export type AutopilotEmptyState = {
  title: string
  body: string
  nextStep: AutopilotNextStep
}

function toDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function fallbackTimestamp(...values: Array<string | null | undefined>): string | null {
  return values.find((value) => typeof value === 'string' && value.trim()) ?? null
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
  const latestTrace = traces
    .filter((trace) => typeof trace.message === 'string' && trace.message.trim())
    .reduce<AutopilotRunTrace | undefined>((latest, trace) => {
      if (!latest) return trace
      return new Date(trace.timestamp ?? 0).getTime() > new Date(latest.timestamp ?? 0).getTime() ? trace : latest
    }, undefined)

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

export function analyzeAutopilotIntegration(input: {
  agents?: AutopilotAgentSummary[]
  runs: AutopilotRunSummary[]
  alerts: AutopilotAlertSummary[]
  approvals: AutopilotApprovalSummary[]
  budget: AutopilotBudgetSummary | null
  usage: AutopilotUsageBreakdown | null
  approvalGateConfigured: boolean
}): AutopilotIntegrationStatus {
  const hasRuns = input.runs.length > 0
  const hasAlerts = input.alerts.length > 0
  const hasApprovalRecords = input.approvals.length > 0
  const hasBudget = Boolean(input.budget)
  const hasUsage = Boolean(
    input.usage &&
      (input.usage.total_credits_used > 0 ||
        input.usage.usage_by_agent.length > 0 ||
        input.usage.usage_by_type.length > 0)
  )

  return {
    hasLiveAgent:
      (input.agents?.length ?? 0) > 0 ||
      hasRuns ||
      hasAlerts ||
      hasApprovalRecords ||
      hasBudget ||
      hasUsage,
    hasRuns,
    hasAlerts,
    hasBudget,
    hasUsage,
    hasApprovalRecords,
    approvalGateConfigured: input.approvalGateConfigured,
  }
}

export function getRunsEmptyState(status: AutopilotIntegrationStatus, nextStep: AutopilotNextStep): AutopilotEmptyState {
  if (!status.hasLiveAgent) {
    return {
      title: 'No monitored agent exists yet',
      body: 'Pico has no real MUTX agent to attach to. Create or deploy one actual agent first, then come back for run history.',
      nextStep,
    }
  }

  return {
    title: 'An agent exists, but nothing has run yet',
    body: 'MUTX knows about at least one agent, but there is no run history yet. Trigger one real task or wait for the first schedule tick, then come back here.',
    nextStep,
  }
}

export function getAlertsEmptyState(status: AutopilotIntegrationStatus, nextStep: AutopilotNextStep): AutopilotEmptyState {
  if (!status.hasRuns) {
    return {
      title: 'No alerts because nothing is running yet',
      body: 'An empty alert feed means nothing until the agent has executed real work. Get one run into MUTX first.',
      nextStep,
    }
  }

  return {
    title: 'No live alerts right now',
    body: 'Good. The monitoring feed is quiet right now. Keep watching the next real run and failure path.',
    nextStep,
  }
}

export function getUsageEmptyState(status: AutopilotIntegrationStatus, nextStep: AutopilotNextStep): AutopilotEmptyState {
  if (!status.hasBudget) {
    return {
      title: 'No live budget snapshot yet',
      body: 'There is no MUTX budget snapshot to compare against yet. Until that exists, cost awareness is incomplete.',
      nextStep,
    }
  }

  return {
    title: 'Budget exists, but usage is empty',
    body: 'The budget surface is live, but no usage events landed in the current window. Either the agent has not spent anything yet or usage emission is missing.',
    nextStep,
  }
}

export function getApprovalsEmptyState(status: AutopilotIntegrationStatus, nextStep: AutopilotNextStep): AutopilotEmptyState {
  if (!status.hasLiveAgent) {
    return {
      title: 'No agent exists to gate yet',
      body: 'Approval queues only matter when a real agent is capable of doing something risky. Create or deploy the agent first.',
      nextStep,
    }
  }

  if (status.hasApprovalRecords && !status.approvalGateConfigured) {
    return {
      title: 'Approval history exists, but the gate is off locally',
      body: 'MUTX already has approval records, but Pico still says the gate is disabled. Turn the gate on here so local product state matches the control-plane reality.',
      nextStep,
    }
  }

  return {
    title: 'No approval records yet',
    body: 'Nothing risky has been routed through the real approval queue yet. Exercise one real gated action before you call this governed.',
    nextStep,
  }
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
      href: '#runs-section',
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
      href: '#alerts-section',
      sourceLabel: 'Alerts',
    })
  })

  const getApprovalSeverity = (status: string): 'warn' | 'good' | 'critical' | 'neutral' => {
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
    const summary =
      typeof approval.payload?.summary === 'string' && approval.payload.summary.trim()
        ? approval.payload.summary
        : `Requested by ${approval.requester}.`

    timeline.push({
      id: `approval-${approval.id}`,
      kind: 'approval',
      occurredAt: fallbackTimestamp(approval.resolved_at, approval.created_at),
      title: `${titleCase(approval.action_type)} ${normalized.toLowerCase()}`,
      detail: excerpt(summary, 180) ?? `Requested by ${approval.requester}.`,
      impact: explainApprovalImpact(approval),
      severity: getApprovalSeverity(normalized),
      href: '#approvals-section',
      sourceLabel: 'Approvals',
    })
  })

  return timeline.sort((left, right) => new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime())
}
