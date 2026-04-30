import { getLessonBySlug, searchLessonCorpus } from '@/lib/pico/academy'

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

export type PicoTutorCommand = {
  label: string
  code: string
  language: string
  note?: string | null
}

export type PicoTutorSource = {
  kind: 'lesson' | 'knowledge_pack' | 'official'
  title: string
  sourcePath: string
  href?: string | null
  excerpt?: string | null
}

export type PicoTutorStructuredReply = {
  situation: string
  diagnosis: string
  steps: string[]
  commands: PicoTutorCommand[]
  verify: string[]
  ifThisFails: string[]
  officialLinks: Array<{
    label: string
    href: string
    sourcePath: string
  }>
  sources: PicoTutorSource[]
  nextQuestion?: string | null
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
  structured: PicoTutorStructuredReply
  intent: 'choose' | 'install' | 'repair' | 'migrate' | 'compare' | 'tailscale' | 'optimize' | 'integrate'
  skillLevel: 'beginner' | 'intermediate' | 'advanced'
  usedOfficialFallback: boolean
}

const RISKY_KEYWORDS = [
  'delete',
  'production',
  'billing',
  'payment',
  'credential',
  'token',
  'secret',
  'security',
  'breach',
] as const

export function answerPicoTutorQuestion(
  question: string,
  options?: { lessonSlug?: string | null },
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
        'I cannot match that to the shipped Pico lesson corpus yet. Use support and include the exact command, error, and what you expected to happen.',
      lessonSlug: null,
      lessonTitle: null,
      matches: [],
      nextActions: [
        'Open support and paste the exact command or stack trace.',
        'State which lesson you were following.',
        'Include the last step that actually worked.',
      ],
      escalationReason: 'No lesson match found.',
    }
  }

  if (riskyTopic) {
    return {
      answer: `This question touches ${riskyTopic}, which is where Tutor should be careful. Follow the steps below, then escalate before doing anything irreversible.`,
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
      escalationReason:
        'Security or irreversible action detected. Escalate before executing the risky step.',
    }
  }

  const nextActions = best.steps.slice(0, 3).map((step) => `${step.title}: ${step.body}`)
  const troubleshooting = best.troubleshooting[0]

  return {
    answer: [
      `Best match: ${best.title}.`,
      best.objective,
      `Do this next: ${nextActions[0] ?? best.validation}`,
      troubleshooting ? `Watch for this failure mode: ${troubleshooting}` : '',
      `Validation: ${best.validation}`,
    ]
      .filter(Boolean)
      .join(' '),
    lessonSlug: best.slug,
    lessonTitle: best.title,
    matches: matches.map((match) => ({
      slug: match.lesson.slug,
      title: match.lesson.title,
      score: match.score,
      reason: `Matched lesson body, troubleshooting, and validation steps for ${match.lesson.title}.`,
    })),
    nextActions,
    escalationReason:
      matches[0]?.score && matches[0].score >= 4
        ? null
        : 'Low-confidence match. Escalate if the first next action does not fix it.',
  }
}

type LegacyTutorReply = Omit<PicoTutorReply, 'structured' | 'intent' | 'skillLevel' | 'usedOfficialFallback'> & {
  structured?: PicoTutorStructuredReply
  intent?: PicoTutorReply['intent']
  skillLevel?: PicoTutorReply['skillLevel']
  usedOfficialFallback?: boolean
}

export function normalizeTutorReplyPayload(payload: LegacyTutorReply | { reply?: LegacyTutorReply } | null | undefined): PicoTutorReply | null {
  const raw =
    payload && 'answer' in payload && typeof payload.answer === 'string'
      ? payload
      : payload && 'reply' in payload && payload.reply && typeof payload.reply.answer === 'string'
        ? payload.reply
        : null

  if (!raw) {
    return null
  }

  if (raw.structured && raw.intent && raw.skillLevel && typeof raw.usedOfficialFallback === 'boolean') {
    return raw as PicoTutorReply
  }

  return {
    ...raw,
    structured: raw.structured ?? {
      situation: raw.summary,
      diagnosis: raw.answer,
      steps: raw.nextActions,
      commands: [],
      verify: [],
      ifThisFails: raw.escalationReason ? [raw.escalationReason] : [],
      officialLinks: raw.docs,
      sources: raw.docs.map((doc) => ({
        kind: doc.href.startsWith('http') ? 'official' : 'knowledge_pack',
        title: doc.label,
        sourcePath: doc.sourcePath,
        href: doc.href,
      })),
      nextQuestion: null,
    },
    intent: raw.intent ?? 'repair',
    skillLevel: raw.skillLevel ?? 'intermediate',
    usedOfficialFallback: raw.usedOfficialFallback ?? false,
  }
}
