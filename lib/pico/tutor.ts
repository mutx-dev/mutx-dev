import { getLessonBySlug, searchLessonCorpus, type PicoProgressState } from '@/lib/pico/academy'

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

export function answerPicoTutorQuestion(
  question: string,
  options?: { lessonSlug?: string | null; progress?: Partial<PicoProgressState> | null },
): PicoTutorAnswer {
  const normalizedQuestion = question.trim()
  const lowerQuestion = normalizedQuestion.toLowerCase()
  const directLesson = options?.lessonSlug ? getLessonBySlug(options.lessonSlug) : null
  const matches = searchLessonCorpus(`${options?.lessonSlug ?? ''} ${normalizedQuestion}`)
  const best = directLesson ?? matches[0]?.lesson ?? null

  const riskyTopic = RISKY_KEYWORDS.find((keyword) => lowerQuestion.includes(keyword))
  if (!best) {
    return {
      answer:
        'I cannot ground that in the shipped Pico lesson corpus yet. Use the support lane and include the exact command, error, and what you expected to happen.',
      lessonSlug: null,
      lessonTitle: null,
      matches: [],
      nextActions: [
        'Open the support lane and paste the exact command or stack trace.',
        'State which lesson you were following.',
        'Include the last step that actually worked.',
      ],
      escalationReason: 'No grounded lesson match found.',
    }
  }

  if (riskyTopic) {
    return {
      answer: `This question touches ${riskyTopic}, which is where the tutor should stop bluffing. Follow the grounded steps below, then escalate before doing anything irreversible.`,
      lessonSlug: best.slug,
      lessonTitle: best.title,
      matches: matches.map((match) => ({
        slug: match.lesson.slug,
        title: match.lesson.title,
        score: match.score,
        reason: `Matched lesson objective and troubleshooting notes for ${match.lesson.title}.`,
      })),
      nextActions: [
        best.steps[0]?.body ?? 'Re-read the first step in the matched lesson.',
        best.validation,
        'Escalate with the exact command, environment, and intended action before executing the risky part.',
      ],
      escalationReason: 'Security or irreversible action detected. Escalate before executing the risky step.',
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

  return {
    answer,
    lessonSlug: best.slug,
    lessonTitle: best.title,
    matches: matches.map((match) => ({
      slug: match.lesson.slug,
      title: match.lesson.title,
      score: match.score,
      reason: `Matched lesson body, troubleshooting, and validation steps for ${match.lesson.title}.`,
    })),
    nextActions,
    escalationReason: matches[0]?.score && matches[0].score >= 4 ? null : 'Low-confidence match. Escalate if the first next action does not fix it.',
  }
}

export function answerTutorQuestion(
  question: string,
  options?: { lessonSlug?: string | null; progress?: Partial<PicoProgressState> | null | Record<string, unknown> },
): PicoTutorReply {
  const answer = answerPicoTutorQuestion(question, {
    lessonSlug: options?.lessonSlug ?? null,
    progress: options?.progress as Partial<PicoProgressState> | null | undefined,
  })
  const lessons = answer.matches.map((match) => ({
    id: match.slug,
    title: match.title,
    href: `/pico/academy/${match.slug}`,
  }))

  const docs = [SUPPORT_DOC, ...lessons.map((lesson) => ({
    label: lesson.title,
    href: lesson.href,
    sourcePath: `pico/academy/${lesson.id}`,
  }))].slice(0, 4)

  const topScore = answer.matches[0]?.score ?? 0

  return {
    title: answer.lessonTitle ?? 'Pico tutor answer',
    summary: answer.answer,
    answer: answer.answer,
    confidence: answer.escalationReason ? 'low' : topScore >= 5 ? 'high' : 'medium',
    nextActions: answer.nextActions,
    lessons,
    docs,
    recommendedLessonIds: lessons.map((lesson) => lesson.id),
    escalate: Boolean(answer.escalationReason),
    escalationReason: answer.escalationReason ?? undefined,
  }
}
