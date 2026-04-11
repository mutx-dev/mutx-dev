import {
  deriveDeploymentFailureGuidance,
  deriveRuntimeFailureGuidance,
} from '../../lib/dashboardFailureGuidance'

describe('dashboard failure guidance', () => {
  it('routes failed deployments into the deployment lesson and logs', () => {
    const guidance = deriveDeploymentFailureGuidance({
      deploymentId: 'dep_123',
      status: 'failed',
      errorMessage: 'Railway build exited with status 1',
      events: [],
    })

    expect(guidance?.kind).toBe('deployment_failed')
    expect(guidance?.stageNote).toMatch(/normal at this stage/i)
    expect(guidance?.primaryAction.href).toBe('/pico/academy/deploy-hermes-on-a-vps')
    expect(guidance?.secondaryAction?.href).toBe('/dashboard/logs?deploymentId=dep_123')
  })

  it('treats heartbeat failures as agent-not-responding guidance', () => {
    const guidance = deriveDeploymentFailureGuidance({
      deploymentId: 'dep_heartbeat',
      status: 'failed',
      errorMessage: 'Agent research-bot failed to report heartbeat for 120s',
      events: [
        {
          event_type: 'monitor_failed',
          status: 'failed',
          error_message: 'Agent research-bot failed to report heartbeat for 120s',
        },
      ],
    })

    expect(guidance?.kind).toBe('agent_not_responding')
    expect(guidance?.primaryAction.href).toBe('/pico/academy/keep-your-agent-alive')
    expect(guidance?.secondaryAction?.href).toBe('/pico/support')
  })

  it('flags stale runtime heartbeats as not responding', () => {
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-04-11T03:10:00.000Z').getTime())

    const guidance = deriveRuntimeFailureGuidance({
      status: 'running',
      heartbeatAt: '2026-04-11T03:04:00.000Z',
    })

    expect(guidance?.kind).toBe('agent_not_responding')
    expect(guidance?.title).toMatch(/not responding/i)
    expect(guidance?.primaryAction.href).toBe('/pico/academy/keep-your-agent-alive')

    jest.restoreAllMocks()
  })

  it('stays quiet when no failure signal exists', () => {
    const deploymentGuidance = deriveDeploymentFailureGuidance({
      deploymentId: 'dep_ok',
      status: 'running',
      errorMessage: null,
      events: [{ event_type: 'rollout_started', status: 'running', error_message: null }],
    })

    const runtimeGuidance = deriveRuntimeFailureGuidance({
      status: 'healthy',
      heartbeatAt: '2026-04-11T03:09:30.000Z',
    })

    expect(deploymentGuidance).toBeNull()
    expect(runtimeGuidance).toBeNull()
  })
})
