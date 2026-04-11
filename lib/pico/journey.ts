import {
  derivePicoProgress,
  getLessonBySlug,
  getTrackBySlug,
  normalizePicoProgress,
  PICO_TRACKS,
  type PicoLesson,
  type PicoProgressState,
  type PicoTrack,
} from '@/lib/pico/academy'

export type PicoJourneyTarget = {
  track: PicoTrack
  lesson: PicoLesson
  selected: boolean
  completed: boolean
}

export type PicoPrimaryJourney = {
  href: string
  label: string
  description: string
  track: PicoTrack
  lesson: PicoLesson | null
}

export type PicoLessonFollowUp = {
  kind: 'prerequisite' | 'complete' | 'lesson' | 'autopilot'
  label: string
  description: string
  href: string | null
  lesson: PicoLesson | null
}

function getFirstTrack() {
  return PICO_TRACKS[0]
}

function getFirstLesson(track: PicoTrack) {
  return track.lessons
    .map((lessonSlug) => getLessonBySlug(lessonSlug))
    .find((lesson): lesson is PicoLesson => Boolean(lesson))
}

export function getPicoTrackTarget(
  progressInput: Partial<PicoProgressState> | null | undefined,
  trackSlug: string
): PicoJourneyTarget {
  const progress = normalizePicoProgress(progressInput)
  const derived = derivePicoProgress(progress)
  const track = getTrackBySlug(trackSlug) ?? getFirstTrack()
  const completedLessons = new Set(progress.completedLessons)
  const unlockedLessons = new Set(derived.unlockedLessonSlugs)

  const lesson =
    track.lessons
      .map((lessonId) => getLessonBySlug(lessonId))
      .find(
        (candidate): candidate is PicoLesson =>
          candidate != null &&
          !completedLessons.has(candidate.slug) &&
          unlockedLessons.has(candidate.slug)
      ) ??
    getFirstLesson(track)

  if (!lesson) {
    throw new Error(`Track ${track.slug} has no lesson target`)
  }

  return {
    track,
    lesson,
    selected: progress.selectedTrack === track.slug,
    completed: track.lessons.every((lessonId) => completedLessons.has(lessonId)),
  }
}

export function getPicoPrimaryJourney(
  progressInput: Partial<PicoProgressState> | null | undefined
): PicoPrimaryJourney {
  const progress = normalizePicoProgress(progressInput)
  const derived = derivePicoProgress(progress)
  const defaultTrack = getPicoTrackTarget(progress, progress.selectedTrack ?? getFirstTrack().slug)

  if (!progress.selectedTrack && progress.completedLessons.length === 0) {
    return {
      href: `/academy/${defaultTrack.lesson.slug}`,
      label: `Start ${defaultTrack.track.title}`,
      description: `Begin with ${defaultTrack.lesson.title}. ${defaultTrack.lesson.summary}`,
      track: defaultTrack.track,
      lesson: defaultTrack.lesson,
    }
  }

  if (derived.nextLesson) {
    const nextTrack = getTrackBySlug(derived.nextLesson.track) ?? defaultTrack.track
    return {
      href: `/academy/${derived.nextLesson.slug}`,
      label: `Continue with ${derived.nextLesson.title}`,
      description: derived.nextLesson.summary,
      track: nextTrack,
      lesson: derived.nextLesson,
    }
  }

  return {
    href: '/autopilot',
    label: 'Open autopilot',
    description: 'You cleared the academy map. Inspect runs, budget, alerts, and approvals next.',
    track: defaultTrack.track,
    lesson: null,
  }
}

export function getPicoLessonFollowUp(
  progressInput: Partial<PicoProgressState> | null | undefined,
  lessonSlug: string
): PicoLessonFollowUp | null {
  const progress = normalizePicoProgress(progressInput)
  const lesson = getLessonBySlug(lessonSlug)

  if (!lesson) {
    return null
  }

  const completedLessons = new Set(progress.completedLessons)
  const missingPrerequisite = lesson.prerequisites
    .map((prerequisite) => getLessonBySlug(prerequisite))
    .find(
      (candidate): candidate is PicoLesson => candidate != null && !completedLessons.has(candidate.slug)
    )
  const nextLesson = lesson.nextLesson ? getLessonBySlug(lesson.nextLesson) : null

  if (missingPrerequisite) {
    return {
      kind: 'prerequisite',
      label: `Finish ${missingPrerequisite.title}`,
      description: 'This lesson stays locked until the prerequisite is done.',
      href: `/academy/${missingPrerequisite.slug}`,
      lesson: missingPrerequisite,
    }
  }

  if (!completedLessons.has(lesson.slug)) {
    return {
      kind: 'complete',
      label: `Complete for +${lesson.xp} XP`,
      description: nextLesson
        ? `Validate the result, then complete this lesson to unlock ${nextLesson.title}.`
        : 'Validate the result, then complete this lesson to unlock Autopilot.',
      href: null,
      lesson: nextLesson,
    }
  }

  if (nextLesson) {
    return {
      kind: 'lesson',
      label: `Continue to ${nextLesson.title}`,
      description: nextLesson.summary,
      href: `/academy/${nextLesson.slug}`,
      lesson: nextLesson,
    }
  }

  return {
    kind: 'autopilot',
    label: 'Open autopilot',
    description: 'This branch is done. Inspect the live control loop next.',
    href: '/autopilot',
    lesson: null,
  }
}
