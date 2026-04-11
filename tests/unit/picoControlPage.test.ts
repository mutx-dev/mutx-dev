import {
  buildStarterDeployEventPayload,
  buildStarterDeployPayload,
  extractPicoControlError,
  slugifyAssistantId,
} from '@/components/pico/PicoControlPage'

describe('PicoControlPage helpers', () => {
  it('slugifies starter assistant ids into control-plane safe values', () => {
    expect(slugifyAssistantId('  Pico Assistant ++ Launch  ')).toBe('pico-assistant-launch')
    expect(slugifyAssistantId('!!!')).toBe('pico-assistant')
  })

  it('builds the starter deploy payload with Pico source metadata intact', () => {
    expect(
      buildStarterDeployPayload({
        name: 'Pico Assistant ++ Launch',
        workspace: 'alpha-team',
        model: 'openai/gpt-5',
      }),
    ).toEqual({
      name: 'Pico Assistant ++ Launch',
      description: 'Starter assistant deployed from PicoMUTX',
      model: 'openai/gpt-5',
      assistant_id: 'pico-assistant-launch',
      workspace: 'alpha-team',
      replicas: 1,
      skills: ['workspace_memory'],
      runtime_metadata: {
        launched_from: 'pico',
        academy: true,
      },
    })
  })

  it('extracts a Pico deployment receipt into the follow-up learner event payload', () => {
    expect(
      buildStarterDeployEventPayload({
        template_id: 'personal_assistant',
        agent: { id: 'agent-123' },
        deployment: { id: 'deploy-456' },
      }),
    ).toEqual({
      event: 'starter_agent_deployed',
      metadata: {
        template_id: 'personal_assistant',
        agent_id: 'agent-123',
        deployment_id: 'deploy-456',
      },
    })
  })

  it('prefers structured API errors over a generic fallback', () => {
    expect(extractPicoControlError({ detail: 'Sign in first' }, 'fallback')).toBe('Sign in first')
    expect(extractPicoControlError({ error: { message: 'Template missing' } }, 'fallback')).toBe(
      'Template missing',
    )
    expect(extractPicoControlError(null, 'fallback')).toBe('fallback')
  })
})
