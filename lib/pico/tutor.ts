import { PICO_LESSON_MAP, PICO_LESSONS, PICO_TRACKS } from '@/lib/pico/content'
import { type PicoWorkspaceState } from '@/lib/pico/state'

export type TutorAnswer = {
  answer: string
  recommendedLessonIds: string[]
  escalate: boolean
  escalationReason?: string
}

export type PicoTutorAnswer = {
  answer: string
  lessonSlug: string | null
  lessonTitle: string | null
  matches: Array<{
    slug: string
    title: string
    score: number
    reason: string
  }>
  nextActions: string[]
  escalationReason: string | null
}

const ESCALATION_KEYWORDS = [
  'billing',
  'invoice',
  'payment',
  'delete production',
  'delete database',
  'legal',
  'security breach',
  'leak',
  'lost key',
  'compromised',
  'refund',
  'token',
  'secret',
]

const COMMON_INTENTS: Array<{
  keywords: string[]
  answer: string
  lessonIds: string[]
}> = [
  {
    keywords: ['install', 'setup', 'path', 'binary', 'local'],
    answer:
      'Start with the install path. Confirm the hermes binary resolves cleanly before touching providers or prompts. Then run one short prompt and save the exact working command. Do not debug three layers at once.',
    lessonIds: ['install-hermes-locally', 'run-first-agent'],
  },
  {
    keywords: ['vps', 'deploy', 'server', 'persistent', 'ssh'],
    answer:
      'Treat deployment as a copy of the local-good path, not a reinvention. Install the same way, wrap it in a process manager, then verify it survives disconnect or restart.',
    lessonIds: ['deploy-hermes-vps', 'keep-agent-alive'],
  },
  {
    keywords: ['telegram', 'discord', 'slack', 'webhook', 'interface', 'channel'],
    answer:
      'Pick one interface only. Get one live message through end to end. If credentials fail, validate the integration outside Hermes first and then wire it back in.',
    lessonIds: ['connect-interface-layer'],
  },
  {
    keywords: ['skill', 'tool', 'capability', 'mcp'],
    answer:
      'Narrow the capability to one job with one success condition. Add the skill, write a task that clearly requires it, and save the first successful run so you have proof instead of vibes.',
    lessonIds: ['add-first-skill-tool'],
  },
  {
    keywords: ['cron', 'schedule', 'automation', 'workflow'],
    answer:
      'Scheduled prompts must be fully self-contained. Run the exact command manually before cron. If it only works interactively, the schedule is not the problem.',
    lessonIds: ['create-scheduled-workflow'],
  },
  {
    keywords: ['logs', 'activity', 'monitor', 'observability', 'history'],
    answer:
      'Log run start, run finish, and errors in plain English first. Fancy telemetry can come later. If you cannot tell the last good run from the last bad one, the trail is still useless.',
    lessonIds: ['see-agent-activity'],
  },
  {
    keywords: ['budget', 'cost', 'threshold', 'credits'],
    answer:
      'Set a ceiling you are actually willing to pay, then add a warning before you hit it. Exact accounting can improve later. Silent cost drift is the real enemy.',
    lessonIds: ['set-cost-threshold'],
  },
  {
    keywords: ['approval', 'gate', 'risky', 'human'],
    answer:
      'Gate the action class that would hurt if it ran wrong: outbound messages, deletions, purchases, or credential changes. Test approve and deny paths immediately so the queue is not decorative.',
    lessonIds: ['add-approval-gate'],
  },
  {
    keywords: ['lead', 'sales', 'response'],
    answer:
      'Keep the lead-response agent narrow: capture, triage, draft, approve. If you let it send messages before the triage and approval logic is stable, you are just automating regret.',
    lessonIds: ['build-lead-response-agent'],
  },
  {
    keywords: ['document', 'invoice', 'resume', 'contract', 'ocr'],
    answer:
      'Document agents only behave once the input type and output schema are painfully clear. Pick one document family, one field set, and one fallback for uncertainty.',
    lessonIds: ['build-document-processing-agent'],
  },
]

function normalize(text: string) {
  return text.toLowerCase().trim()
}

function includesEscalationKeyword(query: string) {
  const normalized = normalize(query)
  return ESCALATION_KEYWORDS.find((keyword) => normalized.includes(keyword))
}

function searchLessons(query: string) {
  const terms = normalize(query).split(/\W+/).filter(Boolean)

  const scored = PICO_LESSONS.map((lesson) => {
    const haystack = normalize(
      [lesson.title, lesson.objective, lesson.expectedResult, lesson.validationStep, ...lesson.troubleshooting].join(' '),
    )

    const score = terms.reduce((acc, term) => acc + (haystack.includes(term) ? 1 : 0), 0)
    return { lesson, score }
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)

  return scored
}

function intentMatch(query: string) {
  const normalized = normalize(query)
  return COMMON_INTENTS.find((intent) => intent.keywords.some((keyword) => normalized.includes(keyword)))
}

export function answerTutorQuestion(query: string, state: PicoWorkspaceState): TutorAnswer {
  const trimmed = query.trim()
  if (!trimmed) {
    return {
      answer: 'Ask one concrete question. Good: “Why does my VPS run die after disconnect?” Bad: “agent help pls.”',
      recommendedLessonIds: [],
      escalate: false,
    }
  }

  const escalationKeyword = includesEscalationKeyword(trimmed)
  if (escalationKeyword) {
    return {
      answer:
        'This needs a human, not a breezy autogenerated guess. Freeze the risky action, capture what changed, and escalate through the support lane with the exact error, environment, and last known good state.',
      recommendedLessonIds: [],
      escalate: true,
      escalationReason: `Detected a risk-sensitive topic: ${escalationKeyword}.`,
    }
  }

  const intent = intentMatch(trimmed)
  const lessonMatches = searchLessons(trimmed).slice(0, 3)
  const recommendedLessonIds = intent?.lessonIds || lessonMatches.map((item) => item.lesson.id)

  const currentTrack = PICO_TRACKS.find((track) => track.id === state.focusTrackId)
  const nextIncomplete = lessonMatches.find((item) => !state.completedLessonIds.includes(item.lesson.id))?.lesson

  const answerParts = [
    intent?.answer ||
      'Use the next lesson that matches the block. Follow the validation step exactly. If the validation fails, step back to the previous layer instead of piling on more moving parts.',
  ]

  if (nextIncomplete) {
    answerParts.push(`Best next move: work lesson "${nextIncomplete.title}" and stop once its validation step passes.`)
  }

  if (currentTrack) {
    answerParts.push(`You are currently focused on ${currentTrack.title}. Stay on that lane until you have a working artifact.`)
  }

  if (recommendedLessonIds.length === 0) {
    answerParts.push('If none of the academy lessons fit, use the human escalation lane and include the exact command, output, and what you already tried.')
  }

  return {
    answer: answerParts.join(' '),
    recommendedLessonIds,
    escalate: false,
  }
}

export function answerPicoTutorQuestion(
  question: string,
  options?: { lessonSlug?: string | null; progress?: Partial<PicoWorkspaceState> | null },
): PicoTutorAnswer {
  const state = {
    focusTrackId: 'track-a',
    completedLessonIds: [],
    ...(options?.progress ?? {}),
  } as PicoWorkspaceState

  const base = answerTutorQuestion(question, state)
  const matches = searchLessons(question).slice(0, 3).map((item) => ({
    slug: item.lesson.id,
    title: item.lesson.title,
    score: item.score,
    reason: `Matched lesson objective, validation, and troubleshooting for ${item.lesson.title}.`,
  }))

  const primaryLesson = options?.lessonSlug && PICO_LESSON_MAP[options.lessonSlug]
    ? PICO_LESSON_MAP[options.lessonSlug]
    : base.recommendedLessonIds[0]
      ? PICO_LESSON_MAP[base.recommendedLessonIds[0]]
      : null

  return {
    answer: base.answer,
    lessonSlug: primaryLesson?.id ?? null,
    lessonTitle: primaryLesson?.title ?? null,
    matches,
    nextActions: primaryLesson?.steps.slice(0, 3) ?? [],
    escalationReason: base.escalate ? base.escalationReason ?? 'Escalation recommended.' : null,
  }
}
