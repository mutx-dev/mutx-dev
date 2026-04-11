import { getLessonBySlug, searchLessonCorpus, type PicoProgressState } from '@/lib/pico/academy'

type PicoTutorMatch = {
  slug: string
  title: string
  score: number
  reason: string
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
  matches: PicoTutorMatch[]
  lessonSlug: string | null
  lessonTitle: string | null
}

type PicoTutorOptions = {
  lessonSlug?: string | null
  progress?: Partial<PicoProgressState> | null
}

const RISKY_KEYWORDS = [
  'delete',
  'production',
  'billing',
  'payment',
  'credential',
  'token',
  'secret',
  'gdpr',
  'legal',
  'contract',
  'security',
  'breach',
]

const SUPPORT_DOC = {
  label: 'Support lane',
  href: '/pico/support',
  sourcePath: 'pico/support',
}

function buildLessonLinks(matches: PicoTutorMatch[]) {
  return matches.map((match) => ({
    id: match.slug,
    title: match.title,
    href: `/pico/academy/${match.slug}`,
  }))
}

function buildTutorReply(question: string, options?: PicoTutorOptions): PicoTutorReply {
  const normalizedQuestion = question.trim()
  const lowerQuestion = normalizedQuestion.toLowerCase()
  const directLesson = options?.lessonSlug ? getLessonBySlug(options.lessonSlug) : null
  const matches = searchLessonCorpus(`${options?.lessonSlug ?? ''} ${normalizedQuestion}`).map((match) => ({
    slug: match.lesson.slug,
    title: match.lesson.title,
    score: match.score,
    reason: `Matched lesson objective, troubleshooting, and validation steps for ${match.lesson.title}.`,
  }))
  const best = directLesson ?? (matches[0] && getLessonBySlug(matches[0].slug))
  const lessons = buildLessonLinks(matches)
  const docs = [
    SUPPORT_DOC,
    ...lessons.map((lesson) => ({
      label: lesson.title,
      href: lesson.href,
      sourcePath: `pico/academy/${lesson.id}`,
    })),
  ].slice(0, 4)
  const riskyTopic = RISKY_KEYWORDS.find((keyword) => lowerQuestion.includes(keyword))

  if (!best) {
    return {
      title: 'Pico tutor answer',
      summary:
        'I cannot ground that in the shipped Pico lesson corpus yet. Use the support lane and include the exact command, error, and what you expected to happen.',
      answer:
        'I cannot ground that in the shipped Pico lesson corpus yet. Use the support lane and include the exact command, error, and what you expected to happen.',
      confidence: 'low',
      nextActions: [
        'Open the support lane and paste the exact command or stack trace.',
        'State which lesson you were following.',
        'Include the last step that actually worked.',
      ],
      lessons: [],
      docs: [SUPPORT_DOC],
      recommendedLessonIds: [],
      escalate: true,
      escalationReason: 'No grounded lesson match found.',
      matches: [],
      lessonSlug: null,
      lessonTitle: null,
    }
  }

  if (riskyTopic) {
    const nextActions = [
      best.steps[0]?.body ?? 'Re-read the first step in the matched lesson.',
      best.validation,
      'Escalate with the exact command, environment, and intended action before executing the risky step.',
    ]

    return {
      title: best.title,
      summary: `This question touches ${riskyTopic}, which is where the tutor should stop bluffing. Follow the grounded steps below, then escalate before doing anything irreversible.`,
      answer: `This question touches ${riskyTopic}, which is where the tutor should stop bluffing. Follow the grounded steps below, then escalate before doing anything irreversible.`,
      confidence: 'low',
      nextActions,
      lessons,
      docs,
      recommendedLessonIds: lessons.map((lesson) => lesson.id),
      escalate: true,
      escalationReason: 'Security or irreversible action detected. Escalate before executing the risky step.',
      matches,
      lessonSlug: best.slug,
      lessonTitle: best.title,
    }
  }

  const nextActions = best.steps.slice(0, 3).map((step) => `${step.title}: ${step.body}`)
  const troubleshooting = best.troubleshooting[0]
  const answer = [
    `Best match: ${best.title}.`,
    best.objective,
    `Do this next: ${nextActions[0] ?? best.validation}`,
    troubleshooting ? `Watch for this failure mode: ${troubleshooting}` : '',
    `Validation: ${best.validation}`,
  ]
    .filter(Boolean)
    .join(' ')
  const topScore = matches[0]?.score ?? 0
  const escalationReason = topScore >= 4 ? undefined : 'Low-confidence match. Escalate if the first next action does not fix it.'

  return {
    title: best.title,
    summary: answer,
    answer,
    confidence: escalationReason ? 'low' : topScore >= 5 ? 'high' : 'medium',
    nextActions,
    lessons,
    docs,
    recommendedLessonIds: lessons.map((lesson) => lesson.id),
    escalate: Boolean(escalationReason),
    escalationReason,
    matches,
    lessonSlug: best.slug,
    lessonTitle: best.title,
  }
}

export function answerTutorQuestion(
  question: string,
  options?: PicoTutorOptions | null | Record<string, unknown>,
): PicoTutorReply {
  const normalizedOptions = options && typeof options === 'object' && !Array.isArray(options)
    ? (options as PicoTutorOptions)
    : undefined

  return buildTutorReply(question, normalizedOptions)
}
