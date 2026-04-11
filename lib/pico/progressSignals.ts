import {
  derivePicoProgress,
  getLessonBySlug,
  getTrackBySlug,
  type PicoProgressState,
} from '@/lib/pico/academy'

export type PicoSessionTransition = 'new' | 'same_day' | 'continued' | 'restart'

export type PicoLocalSession = {
  lastSeenDay: string | null
  streakCount: number
  bestStreakCount: number
  totalSessions: number
}

export type PicoStreakCue = {
  label: string
  body: string
}

export type PicoMomentumCue = {
  title: string
  body: string
  ctaLabel: string
  ctaHref: string
}

export type PicoLessonCelebration = {
  kind: 'lesson_complete' | 'first_run'
  title: string
  body: string
  chips: string[]
  ctaLabel: string | null
  ctaHref: string | null
}

export function createDefaultPicoSession(): PicoLocalSession {
  return {
    lastSeenDay: null,
    streakCount: 0,
    bestStreakCount: 0,
    totalSessions: 0,
  }
}

function normalizePicoSession(value: Partial<PicoLocalSession> | null | undefined): PicoLocalSession {
  const fallback = createDefaultPicoSession()
  const candidate = value ?? {}

  return {
    lastSeenDay:
      typeof candidate.lastSeenDay === 'string' && candidate.lastSeenDay.length > 0
        ? candidate.lastSeenDay
        : fallback.lastSeenDay,
    streakCount:
      typeof candidate.streakCount === 'number' && candidate.streakCount > 0
        ? Math.round(candidate.streakCount)
        : fallback.streakCount,
    bestStreakCount:
      typeof candidate.bestStreakCount === 'number' && candidate.bestStreakCount > 0
        ? Math.round(candidate.bestStreakCount)
        : fallback.bestStreakCount,
    totalSessions:
      typeof candidate.totalSessions === 'number' && candidate.totalSessions > 0
        ? Math.round(candidate.totalSessions)
        : fallback.totalSessions,
  }
}

function toDayKey(now: Date): string {
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dayDistance(fromDay: string, toDay: string): number {
  const from = new Date(`${fromDay}T00:00:00`)
  const to = new Date(`${toDay}T00:00:00`)
  return Math.round((to.getTime() - from.getTime()) / 86400000)
}

export function registerPicoSession(
  sessionInput: Partial<PicoLocalSession> | null | undefined,
  now = new Date(),
): { session: PicoLocalSession; transition: PicoSessionTransition } {
  const session = normalizePicoSession(sessionInput)
  const today = toDayKey(now)

  if (!session.lastSeenDay) {
    return {
      session: {
        lastSeenDay: today,
        streakCount: 1,
        bestStreakCount: 1,
        totalSessions: 1,
      },
      transition: 'new',
    }
  }

  const distance = dayDistance(session.lastSeenDay, today)

  if (distance <= 0) {
    return {
      session: {
        ...session,
        lastSeenDay: today,
      },
      transition: 'same_day',
    }
  }

  if (distance === 1) {
    const streakCount = session.streakCount + 1
    return {
      session: {
        lastSeenDay: today,
        streakCount,
        bestStreakCount: Math.max(session.bestStreakCount, streakCount),
        totalSessions: session.totalSessions + 1,
      },
      transition: 'continued',
    }
  }

  return {
    session: {
      lastSeenDay: today,
      streakCount: 1,
      bestStreakCount: Math.max(session.bestStreakCount, 1),
      totalSessions: session.totalSessions + 1,
    },
    transition: 'restart',
  }
}

export function deriveStreakCue(
  sessionInput: Partial<PicoLocalSession> | null | undefined,
  transition: PicoSessionTransition,
): PicoStreakCue {
  const session = normalizePicoSession(sessionInput)

  if (transition === 'continued' && session.streakCount > 1) {
    return {
      label: `${session.streakCount}-session streak`,
      body: 'Keep it alive. One more session tomorrow keeps the chain moving.',
    }
  }

  if (transition === 'restart') {
    return {
      label: 'Fresh streak',
      body: 'Fresh streak. Pick up the next concrete step and build the rhythm again.',
    }
  }

  if (transition === 'same_day' && session.streakCount > 1) {
    return {
      label: `${session.streakCount}-session streak`,
      body: 'Momentum is already live today. Close one more step while the context is warm.',
    }
  }

  return {
    label: session.totalSessions > 0 ? 'Momentum started' : 'Session 1',
    body: 'Finish one real step on this device and the progress starts to compound.',
  }
}

export function deriveMomentumCue(
  progressInput: Partial<PicoProgressState> | null | undefined,
): PicoMomentumCue {
  const derived = derivePicoProgress(progressInput)
  const nextLesson = derived.nextLesson

  if (!nextLesson) {
    return {
      title: 'Control is visible. Keep the loop honest.',
      body: 'You cleared the current academy map. Open Autopilot and exercise the control layer against live truth.',
      ctaLabel: 'Open Autopilot',
      ctaHref: '/autopilot',
    }
  }

  if (nextLesson.slug === 'deploy-hermes-on-a-vps') {
    return {
      title: "You're 1 step away from deployment",
      body: 'Finish this and move from laptop proof to a persistent runtime you can reach again tomorrow.',
      ctaLabel: nextLesson.title,
      ctaHref: `/academy/${nextLesson.slug}`,
    }
  }

  if (nextLesson.slug === 'set-a-cost-threshold' || nextLesson.slug === 'add-an-approval-gate') {
    return {
      title: 'Finish this to unlock control',
      body: 'Cost thresholds and approval gates are the difference between a working agent and one you can actually trust.',
      ctaLabel: nextLesson.title,
      ctaHref: `/academy/${nextLesson.slug}`,
    }
  }

  return {
    title: `Keep shipping with ${nextLesson.title}`,
    body: nextLesson.expectedResult,
    ctaLabel: nextLesson.title,
    ctaHref: `/academy/${nextLesson.slug}`,
  }
}

export function createLessonCelebration(
  beforeProgress: Partial<PicoProgressState> | null | undefined,
  afterProgress: Partial<PicoProgressState> | null | undefined,
  lessonSlug: string,
): PicoLessonCelebration | null {
  const lesson = getLessonBySlug(lessonSlug)
  if (!lesson) {
    return null
  }

  const beforeDerived = derivePicoProgress(beforeProgress)
  const afterDerived = derivePicoProgress(afterProgress)
  const beforeCompleted = new Set(beforeProgress?.completedLessons ?? [])
  const afterCompleted = new Set(afterProgress?.completedLessons ?? [])

  if (beforeCompleted.has(lessonSlug) || !afterCompleted.has(lessonSlug)) {
    return null
  }

  const xpDelta = Math.max(afterDerived.xp - beforeDerived.xp, lesson.xp)
  const newBadges = afterDerived.badges.filter((badge) => !beforeDerived.badges.includes(badge))
  const newTracks = afterDerived.completedTrackSlugs.filter(
    (trackSlug) => !beforeDerived.completedTrackSlugs.includes(trackSlug)
  )
  const nextLesson = afterDerived.nextLesson

  const chips = [`+${xpDelta} XP`]
  for (const badge of newBadges) {
    chips.push(`Badge unlocked: ${badge}`)
  }
  for (const trackSlug of newTracks) {
    const track = getTrackBySlug(trackSlug)
    if (track) {
      chips.push(`Track cleared: ${track.title}`)
    }
  }

  if (lessonSlug === 'run-your-first-agent') {
    return {
      kind: 'first_run',
      title: 'It works. Your first run landed.',
      body: 'You now have proof the runtime answers a real prompt. Next move: get that proof onto a persistent runtime.',
      chips,
      ctaLabel: nextLesson?.title ?? 'Open academy',
      ctaHref: nextLesson ? `/academy/${nextLesson.slug}` : '/academy',
    }
  }

  return {
    kind: 'lesson_complete',
    title: `${lesson.title} completed`,
    body: nextLesson
      ? `Locked in. ${lesson.outcome} Next: ${nextLesson.title}.`
      : `Locked in. ${lesson.outcome}`,
    chips,
    ctaLabel: nextLesson?.title ?? 'Open Autopilot',
    ctaHref: nextLesson ? `/academy/${nextLesson.slug}` : '/autopilot',
  }
}
