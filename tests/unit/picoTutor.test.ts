import { normalizeTutorReplyPayload } from '../../lib/pico/tutor'

describe('Pico tutor payload normalization', () => {
  it('keeps the structured contract intact', () => {
    const reply = normalizeTutorReplyPayload({
      title: 'Install Hermes locally',
      summary: 'Use the install lane and verify PATH from a fresh shell.',
      answer: 'Use the install lane and verify PATH from a fresh shell.',
      confidence: 'high',
      nextActions: ['Install Hermes', 'Re-open the shell', 'Run command -v hermes'],
      lessons: [{ id: 'install-hermes-locally', title: 'Install Hermes locally', href: '/pico/academy/install-hermes-locally' }],
      docs: [{ label: 'github.com', href: 'https://github.com/nousresearch/hermes-agent', sourcePath: 'github.com' }],
      recommendedLessonIds: ['install-hermes-locally'],
      escalate: false,
      structured: {
        situation: 'Hermes is not on PATH after install.',
        diagnosis: 'This is an install verification problem.',
        steps: ['Re-open the shell', 'Run command -v hermes'],
        commands: [{ label: 'Verify binary', code: 'command -v hermes', language: 'bash' }],
        verify: ['The command resolves to a binary path.'],
        ifThisFails: ['Paste the failing install output.'],
        officialLinks: [{ label: 'GitHub', href: 'https://github.com/nousresearch/hermes-agent', sourcePath: 'github.com' }],
        sources: [{ kind: 'knowledge_pack', title: 'Hermes', sourcePath: 'knowledge/pico_ops/HERMES.md' }],
      },
      intent: 'install',
      skillLevel: 'intermediate',
      usedOfficialFallback: true,
    })

    expect(reply?.structured.commands[0]?.code).toBe('command -v hermes')
    expect(reply?.intent).toBe('install')
    expect(reply?.usedOfficialFallback).toBe(true)
  })

  it('upgrades the legacy tutor shape to the structured contract', () => {
    const reply = normalizeTutorReplyPayload({
      title: 'Create a scheduled workflow',
      summary: 'Open the scheduling lesson and create one cron workflow.',
      answer: 'Open the scheduling lesson and create one cron workflow.',
      confidence: 'medium',
      nextActions: ['Open the scheduling lesson', 'Create one cron workflow'],
      lessons: [{ id: 'create-a-scheduled-workflow', title: 'Create a scheduled workflow', href: '/pico/academy/create-a-scheduled-workflow' }],
      docs: [{ label: 'Support lane', href: '/pico/support', sourcePath: 'pico/support' }],
      recommendedLessonIds: ['create-a-scheduled-workflow'],
      escalate: false,
    })

    expect(reply?.structured.steps).toEqual([
      'Open the scheduling lesson',
      'Create one cron workflow',
    ])
    expect(reply?.structured.sources[0]).toMatchObject({
      kind: 'knowledge_pack',
      title: 'Support lane',
    })
    expect(reply?.skillLevel).toBe('intermediate')
  })
})
