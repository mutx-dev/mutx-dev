import { picoLessons, picoTracks } from '@/lib/pico/catalog'
import { PICO_LESSON_MAP } from '@/lib/pico/content'

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

export type PicoTutorReply = {
  title: string
  summary: string
  answer: string
  confidence: 'high' | 'medium' | 'low'
  nextActions: string[]
  lessons: Array<{ id: string; title: string; href: string }>
  docs: Array<{ label: string; href: string; sourcePath: string }>
  recommendedLessonIds: string[]
  escalate: boolean
  escalationReason?: string
}

const supportEscalation = {
  label: 'Support',
  href: '/support',
  sourcePath: 'support.md',
}

const legacyLessonIdBySlug: Record<string, string> = {
  'install-hermes-locally': 'install-hermes-locally',
  'run-your-first-agent': 'run-first-agent',
  'deploy-hermes-on-a-vps': 'deploy-hermes-vps',
  'keep-your-agent-alive': 'keep-agent-alive',
  'connect-a-messaging-layer': 'connect-interface-layer',
  'add-your-first-skill-tool': 'add-first-skill-tool',
  'create-a-scheduled-workflow': 'create-scheduled-workflow',
  'see-your-agent-activity': 'see-agent-activity',
  'set-a-cost-threshold': 'set-cost-threshold',
  'add-an-approval-gate': 'add-approval-gate',
  'build-a-lead-response-agent': 'build-lead-response-agent',
  'build-a-document-processing-agent': 'build-document-processing-agent',
}

function resolveLegacyLessonId(slug: string, fallbackId: string) {
  const legacyId = legacyLessonIdBySlug[slug] ?? fallbackId
  return legacyId in PICO_LESSON_MAP ? legacyId : fallbackId
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function scoreLesson(question: string, lesson: (typeof picoLessons)[number]) {
  const haystack = tokenize([
    lesson.title,
    lesson.summary,
    lesson.objective,
    lesson.outcome,
    ...lesson.prerequisites,
    ...lesson.validation,
    ...lesson.troubleshooting,
    ...lesson.steps.map((step) => `${step.title} ${step.body}`),
  ].join(' '))
  const needle = tokenize(question)
  let score = 0
  for (const token of needle) {
    if (haystack.includes(token)) {
      score += token.length > 5 ? 3 : 1
    }
  }
  return score
}

export function answerPicoTutorQuestion(question: string): PicoTutorAnswer {
  const normalized = question.trim()
  const mentionsBudget = /budget|cost|credit|spend|threshold/i.test(normalized)
  const mentionsApproval = /approval|approve|deny|gate|review/i.test(normalized)
  const mentionsDeploy = /deploy|vps|server|persistent|alive|restart/i.test(normalized)
  const mentionsInstall = /install|setup|path|binary|cli/i.test(normalized)
  const mentionsSecurity = /security|credential|key|secret|breach|billing|payment|production/i.test(normalized)

  if (!normalized) {
    return {
      answer: 'Name the exact step that is failing and what you expected to happen.',
      lessonSlug: null,
      lessonTitle: null,
      matches: [],
      nextActions: [
        'Name the lesson or deployment step you are blocked on.',
        'Paste the exact error or tell me what you expected to happen.',
      ],
      escalationReason: null,
    }
  }

  const scoredLessons = picoLessons
    .map((lesson) => ({ lesson, score: scoreLesson(normalized, lesson) }))
    .sort((left, right) => right.score - left.score)

  const topLessons = scoredLessons.filter((item) => item.score > 0).slice(0, 3).map((item) => item.lesson)

  if (topLessons.length === 0) {
    return {
      answer: 'I cannot ground that in the shipped Pico lesson set yet, so I will not fake it.',
      lessonSlug: null,
      lessonTitle: null,
      matches: [],
      nextActions: [
        'Rephrase the question around install, deploy, runtime visibility, thresholds, or approvals.',
        'If this is a real content gap, escalate it so Pico can add the missing lesson.',
      ],
      escalationReason: 'No grounded lesson match for the question.',
    }
  }

  const primary = topLessons[0]
  const nextActions = [
    ...primary.validation.slice(0, 2),
    ...primary.troubleshooting.slice(0, 1),
  ]

  if (mentionsInstall) {
    nextActions.unshift('Use the quickstart and CLI docs as ground truth before changing anything else.')
  }
  if (mentionsDeploy) {
    nextActions.unshift('Treat deployment as incomplete until the process survives disconnects and restarts.')
  }
  if (mentionsBudget) {
    nextActions.unshift('Set a threshold first. A rough honest limit beats waiting for perfect cost math.')
  }
  if (mentionsApproval) {
    nextActions.unshift('Use one explicit risky-action gate first. Do not pretend you need a full governance machine on day one.')
  }

  const escalationReason = mentionsSecurity
    ? 'Security or irreversible topic detected. Escalate before taking the risky action.'
    : scoredLessons[0].score < 4
      ? 'Low-confidence match. Escalate if the first next action does not fix it.'
      : null

  return {
    answer: `${primary.summary} Focus track: ${picoTracks.find((track) => track.id === primary.trackId)?.title || 'Pico track'}.`,
    lessonSlug: primary.slug,
    lessonTitle: primary.title,
    matches: topLessons.map((lesson) => ({
      slug: lesson.slug,
      title: lesson.title,
      score: scoreLesson(normalized, lesson),
      reason: `Matched lesson objective, steps, and troubleshooting notes for ${lesson.title}.`,
    })),
    nextActions: Array.from(new Set(nextActions)).slice(0, 4),
    escalationReason,
  }
}

export function answerTutorQuestion(
  question: string,
  _state?: unknown,
): PicoTutorReply {
  const answer = answerPicoTutorQuestion(question)
  const matchedLessons = answer.matches
    .map((match) => picoLessons.find((lesson) => lesson.slug === match.slug))
    .filter((lesson): lesson is NonNullable<typeof lesson> => Boolean(lesson))

  const docs = Array.from(
    new Map(
      [
        ...matchedLessons.flatMap((lesson) => lesson.docLinks),
        supportEscalation,
      ].map((entry) => [entry.href, entry]),
    ).values(),
  ).slice(0, 4)

  const lessons = matchedLessons.map((lesson) => ({
    id: resolveLegacyLessonId(lesson.slug, lesson.id),
    title: lesson.title,
    href: `/academy/${lesson.slug}`,
  }))

  const highConfidence = answer.matches[0]?.score ? answer.matches[0].score >= 5 : false

  return {
    title: answer.lessonTitle ?? 'Pico tutor answer',
    summary: answer.answer,
    answer: answer.answer,
    confidence: highConfidence ? 'high' : answer.escalationReason ? 'low' : 'medium',
    nextActions: answer.nextActions,
    lessons,
    docs,
    recommendedLessonIds: lessons.map((lesson) => lesson.id),
    escalate: Boolean(answer.escalationReason),
    escalationReason: answer.escalationReason ?? undefined,
  }
}
