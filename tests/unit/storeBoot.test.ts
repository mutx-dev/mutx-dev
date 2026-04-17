const pendingBootSteps = {
  auth: 'pending',
  capabilities: 'pending',
  config: 'pending',
  connect: 'pending',
  agents: 'pending',
  sessions: 'pending',
  projects: 'pending',
  memory: 'pending',
  skills: 'pending',
} as const

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

describe('useMissionControl boot', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('tracks boot progress and applies config from the shared shell bootstrap', async () => {
    const fetchMock = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input)

      switch (url) {
        case '/api/auth/me':
          return jsonResponse({
            id: 'user-1',
            username: 'fortune',
            display_name: 'Fortune',
            role: 'admin',
            email: 'fortune@example.com',
          })
        case '/api/settings':
          return jsonResponse({
            subscription: 'pro',
            interface_mode: 'essential',
            org_name: 'MUTX',
          })
        case '/api/dashboard/agents':
          return jsonResponse([{ id: 'agent-1', name: 'Scout' }])
        case '/api/dashboard/sessions':
          return jsonResponse([{ key: 'session-1', id: 'session-1' }])
        case '/api/dashboard/projects':
          return jsonResponse([{ id: 'workspace-1', name: 'workspace-1', sessionCount: 1 }])
        case '/api/dashboard/memory':
          return jsonResponse({
            hasAssistant: false,
            assistant: null,
            workspaceMemoryAvailable: true,
          })
        case '/api/dashboard/clawhub/skills':
        case '/api/dashboard/clawhub/bundles':
        case '/api/dashboard/assistant/overview':
          return jsonResponse([])
        default:
          throw new Error(`Unexpected fetch: ${url}`)
      }
    })

    global.fetch = fetchMock as unknown as typeof fetch

    const { useMissionControl } = await import('../../lib/store')

    useMissionControl.setState({
      bootStarted: false,
      booting: false,
      bootComplete: false,
      bootSteps: { ...pendingBootSteps },
      bootErrors: {},
      capabilitiesChecked: false,
      dashboardMode: 'local',
      interfaceMode: 'full',
      subscription: null,
      orgName: null,
      currentUser: null,
      agents: [],
      sessions: [],
    })

    await useMissionControl.getState().boot()

    const state = useMissionControl.getState()

    expect(state.bootStarted).toBe(true)
    expect(state.booting).toBe(false)
    expect(state.bootComplete).toBe(true)
    expect(state.capabilitiesChecked).toBe(true)
    expect(state.dashboardMode).toBe('gateway')
    expect(state.interfaceMode).toBe('essential')
    expect(state.subscription).toBe('pro')
    expect(state.orgName).toBe('MUTX')
    expect(state.currentUser?.display_name).toBe('Fortune')
    expect(state.bootSteps.auth).toBe('success')
    expect(state.bootSteps.config).toBe('success')
    expect(state.bootSteps.agents).toBe('success')
    expect(state.bootSteps.sessions).toBe('success')
    expect(state.bootSteps.projects).toBe('success')
    expect(state.bootSteps.memory).toBe('success')
    expect(state.bootSteps.skills).toBe('success')
  })

  it('persists interface mode changes through the shared settings endpoint', async () => {
    const fetchMock = jest.fn(async () => jsonResponse({ ok: true }))

    global.fetch = fetchMock as unknown as typeof fetch

    const { useMissionControl } = await import('../../lib/store')

    useMissionControl.setState({
      interfaceMode: 'full',
    })

    useMissionControl.getState().setInterfaceMode('essential')

    expect(useMissionControl.getState().interfaceMode).toBe('essential')
    expect(fetchMock).toHaveBeenCalledWith('/api/settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ interface_mode: 'essential' }),
    })
  })
})
