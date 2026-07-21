import { normalizeMemoryPayload } from '../../components/dashboard/MemoryPageClient'

describe('memory dashboard payload normalization', () => {
  it('turns an incomplete response into a safe empty inventory', () => {
    expect(normalizeMemoryPayload({})).toEqual({
      generatedAt: '',
      assistant: null,
      summary: {
        sessions: 0,
        activeSessions: 0,
        sources: 0,
        documentJobs: 0,
        documentArtifacts: 0,
        reasoningJobs: 0,
        reasoningArtifacts: 0,
      },
      sessions: [],
      sources: [],
      documents: [],
      reasoning: [],
      partials: [],
    })
  })

  it('derives missing summary counts from normalized records', () => {
    const payload = normalizeMemoryPayload({
      sessions: [{ id: 'session-1', active: true }, null],
      sources: [{ source: 'gateway', count: 1 }],
      documents: [{ id: 'doc-1', artifacts: 2 }],
      reasoning: [{ id: 'reason-1', artifacts: 3 }],
    })

    expect(payload.summary).toEqual({
      sessions: 1,
      activeSessions: 1,
      sources: 1,
      documentJobs: 1,
      documentArtifacts: 2,
      reasoningJobs: 1,
      reasoningArtifacts: 3,
    })
    expect(payload.sessions[0]).toMatchObject({
      id: 'session-1',
      label: 'session-1',
      source: 'unknown',
      channel: 'direct',
    })
  })
})
