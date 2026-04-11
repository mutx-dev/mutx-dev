import {
  analyzeAutopilotIntegration,
  buildAutopilotTimeline,
  describeRunDetail,
  explainApprovalImpact,
  formatPercent,
  getAlertsEmptyState,
  getApprovalsEmptyState,
  getRunsEmptyState,
  getUsageEmptyState,
} from '../../components/pico/picoAutopilot'

describe('pico autopilot helpers', () => {
  it('prefers the stored run error when explaining a failed run', () => {
    const detail = describeRunDetail(
      {
        id: 'run-1',
        status: 'FAILED',
        error_message: 'Provider timeout after 30 seconds',
      },
      [
        {
          id: 'trace-1',
          run_id: 'run-1',
          event_type: 'tool_call',
          message: 'Tool call started',
          timestamp: '2026-04-11T01:00:00.000Z',
        },
      ],
    )

    expect(detail).toMatch(/Provider timeout/i)
  })

  it('builds a real activity timeline from runs, alerts, approvals, and budget pressure', () => {
    const timeline = buildAutopilotTimeline({
      runs: [
        {
          id: 'run-1',
          status: 'FAILED',
          error_message: 'Webhook delivery returned 500',
          completed_at: '2026-04-11T01:15:00.000Z',
        },
      ],
      alerts: [
        {
          id: 'alert-1',
          agent_id: 'agent-1',
          type: 'runtime_error',
          message: 'The workflow retried three times and still failed.',
          resolved: false,
          created_at: '2026-04-11T01:10:00.000Z',
        },
      ],
      approvals: [
        {
          id: 'approval-1',
          agent_id: 'agent-1',
          action_type: 'outbound_message_send',
          payload: { summary: 'Send the lead reply to alice@example.com.' },
          status: 'PENDING',
          requester: 'operator@mutx.dev',
          created_at: '2026-04-11T01:20:00.000Z',
        },
      ],
      budget: {
        plan: 'starter',
        credits_total: 1000,
        credits_used: 810,
        credits_remaining: 190,
        usage_percentage: 81,
      },
      thresholdPercent: 75,
      tracesByRunId: {
        'run-1': [
          {
            id: 'trace-2',
            run_id: 'run-1',
            event_type: 'http_request',
            message: 'POST /leads failed with 500',
            timestamp: '2026-04-11T01:14:00.000Z',
          },
        ],
      },
    })

    expect(timeline[0]?.title).toMatch(/Budget threshold breached|Outbound Message Send pending/)
    expect(timeline.some((item) => item.title.includes('Failed run'))).toBe(true)
    expect(timeline.some((item) => item.title.includes('Runtime Error triggered'))).toBe(true)
    expect(timeline.some((item) => item.title.includes('Outbound Message Send pending'))).toBe(true)
    expect(timeline.some((item) => item.impact.match(/line in the sand|human decision|surprising/i))).toBe(true)
  })

  it('explains why pending approvals matter', () => {
    expect(
      explainApprovalImpact({
        id: 'approval-2',
        agent_id: 'agent-1',
        action_type: 'outbound_message_send',
        status: 'PENDING',
        requester: 'operator@mutx.dev',
        created_at: '2026-04-11T01:20:00.000Z',
      }),
    ).toMatch(/human decision/i)
  })

  it('formats percentages for the budget UI', () => {
    expect(formatPercent(81.2)).toBe('81%')
  })

  it('treats a no-agent account as not connected to MUTX yet', () => {
    const status = analyzeAutopilotIntegration({
      runs: [],
      alerts: [],
      approvals: [],
      budget: null,
      usage: null,
      approvalGateConfigured: false,
    })

    expect(status.hasLiveAgent).toBe(false)
    expect(getRunsEmptyState(status, { label: 'Deploy next', href: '/pico/academy/deploy-hermes-on-a-vps' }).title).toMatch(/No monitored agent/i)
  })

  it('distinguishes agent-without-runs from true no-agent state', () => {
    const status = analyzeAutopilotIntegration({
      runs: [],
      alerts: [],
      approvals: [
        {
          id: 'approval-3',
          agent_id: 'agent-1',
          action_type: 'outbound_message_send',
          status: 'PENDING',
          requester: 'operator@mutx.dev',
          created_at: '2026-04-11T01:20:00.000Z',
        },
      ],
      budget: null,
      usage: null,
      approvalGateConfigured: false,
    })

    expect(status.hasLiveAgent).toBe(true)
    expect(status.hasRuns).toBe(false)
    expect(getRunsEmptyState(status, { label: 'Trigger a run', href: '/pico/academy/create-a-scheduled-workflow' }).title).toMatch(/nothing has run yet/i)
  })

  it('explains no-alerts state differently once runs exist', () => {
    const status = analyzeAutopilotIntegration({
      runs: [{ id: 'run-2', agent_id: 'agent-1', status: 'COMPLETED' }],
      alerts: [],
      approvals: [],
      budget: null,
      usage: null,
      approvalGateConfigured: false,
    })

    expect(getAlertsEmptyState(status, { label: 'Inspect runs', href: '/pico/autopilot' }).title).toMatch(/No live alerts right now/i)
  })

  it('calls out budget-without-usage as a separate broken state', () => {
    const status = analyzeAutopilotIntegration({
      runs: [],
      alerts: [],
      approvals: [],
      budget: {
        plan: 'starter',
        credits_total: 1000,
        credits_used: 0,
        credits_remaining: 1000,
        usage_percentage: 0,
      },
      usage: {
        total_credits_used: 0,
        credits_remaining: 1000,
        credits_total: 1000,
        period_start: '2026-04-01T00:00:00.000Z',
        period_end: '2026-04-30T00:00:00.000Z',
        usage_by_agent: [],
        usage_by_type: [],
      },
      approvalGateConfigured: false,
    })

    expect(status.hasBudget).toBe(true)
    expect(status.hasUsage).toBe(false)
    expect(getUsageEmptyState(status, { label: 'Trigger usage', href: '/pico/academy/create-a-scheduled-workflow' }).title).toMatch(/Budget exists, but usage is empty/i)
  })

  it('flags approval history when the local gate is still off', () => {
    const status = analyzeAutopilotIntegration({
      runs: [],
      alerts: [],
      approvals: [
        {
          id: 'approval-4',
          agent_id: 'agent-1',
          action_type: 'outbound_message_send',
          status: 'APPROVED',
          requester: 'operator@mutx.dev',
          created_at: '2026-04-11T01:20:00.000Z',
        },
      ],
      budget: null,
      usage: null,
      approvalGateConfigured: false,
    })

    expect(getApprovalsEmptyState(status, { label: 'Configure gate', href: '/pico/academy/add-an-approval-gate' }).title).toMatch(/gate is off/i)
  })
})
