import { createInitialWorkspaceState } from '../../lib/pico/state'
import { answerTutorQuestion } from '../../lib/pico/tutor'

describe('Pico tutor', () => {
  it('grounds install questions in the setup lessons', () => {
    const answer = answerTutorQuestion('Why is hermes not on my path after install?', createInitialWorkspaceState())

    expect(answer.escalate).toBe(false)
    expect(answer.recommendedLessonIds).toContain('install-hermes-locally')
  })

  it('escalates risky questions instead of bluffing', () => {
    const answer = answerTutorQuestion('I lost a production key and there may be a security breach', createInitialWorkspaceState())

    expect(answer.escalate).toBe(true)
    expect(answer.escalationReason).toMatch(/security/i)
  })

  it('points workflow questions at the scheduling lesson', () => {
    const answer = answerTutorQuestion('How do I schedule a cron workflow for my agent?', createInitialWorkspaceState())

    expect(answer.recommendedLessonIds).toContain('create-a-scheduled-workflow')
    expect(answer.lessons[0]?.href).toBe('/pico/academy/create-a-scheduled-workflow')
  })

  it('maps keepalive questions onto the support lane cleanly', () => {
    const answer = answerTutorQuestion('How do I keep the agent alive after I close SSH?', createInitialWorkspaceState())

    expect(answer.recommendedLessonIds).toContain('keep-your-agent-alive')
    expect(answer.docs.some((doc) => doc.href === '/pico/support')).toBe(true)
  })
})
