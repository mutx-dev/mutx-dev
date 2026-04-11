import {
  getActivityUpgradePrompt,
  getDeploymentUpgradePrompt,
  getMonitoringUpgradePrompt,
  getRunsUpgradePrompt,
} from '@/components/dashboard/upgradeMoments'

describe('upgrade moments', () => {
  it('shows the first-success prompt only after the first successful run', () => {
    const prompt = getRunsUpgradePrompt({
      completedRuns: 1,
      failedRuns: 0,
      totalRuns: 1,
    })

    expect(prompt?.id).toBe('first-successful-run')
    expect(prompt?.title).toContain('First successful run')
  })

  it('prioritizes failure-control when runs are failing', () => {
    const prompt = getRunsUpgradePrompt({
      completedRuns: 3,
      failedRuns: 1,
      totalRuns: 5,
    })

    expect(prompt?.id).toBe('failure-control')
    expect(prompt?.message).toContain('Upgrade for alerts')
  })

  it('shows the repeat-run prompt once usage becomes habitual', () => {
    const prompt = getRunsUpgradePrompt({
      completedRuns: 4,
      failedRuns: 0,
      totalRuns: 6,
    })

    expect(prompt?.id).toBe('repeated-runs')
    expect(prompt?.title).toContain('running on repeat')
  })

  it('shows the deployment prompt once a live deployment exists', () => {
    const prompt = getDeploymentUpgradePrompt({ runningDeployments: 1 })

    expect(prompt?.id).toBe('after-deployment')
    expect(prompt?.title).toBe('You now have a live agent.')
  })

  it('shows an activity-check prompt when users inspect healthy monitoring state', () => {
    const prompt = getMonitoringUpgradePrompt({
      unresolvedAlerts: 0,
      totalAlerts: 2,
      healthStatus: 'healthy',
    })

    expect(prompt?.id).toBe('activity-check')
  })

  it('shows failure-control when monitoring reports unresolved pain', () => {
    const prompt = getMonitoringUpgradePrompt({
      unresolvedAlerts: 2,
      totalAlerts: 2,
      healthStatus: 'degraded',
    })

    expect(prompt?.id).toBe('failure-control')
    expect(prompt?.title).toContain('needs control')
  })

  it('shows an activity prompt only when there is actual activity to inspect', () => {
    expect(getActivityUpgradePrompt({ eventCount: 0 })).toBeNull()
    expect(getActivityUpgradePrompt({ eventCount: 4 })?.id).toBe('activity-check')
  })
})
