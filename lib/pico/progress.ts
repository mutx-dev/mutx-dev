import {
  type PicoLesson,
  type PicoLevel,
  type PicoProductState,
  picoLessonById,
  picoLessons,
  picoLevels,
  picoTracks,
} from '@/lib/pico/catalog'

export type PicoProgressSummary = {
  xp: number
  completedLessons: number
  totalLessons: number
  currentLevel: PicoLevel
  nextLevel: PicoLevel | null
  currentLevelProgress: number
  nextLesson: PicoLesson | null
  completedTrackIds: string[]
}

const levelThresholds = [0, 100, 250, 425, 625, 850, 1100]

export function createDefaultPicoState(): PicoProductState {
  return {
    version: 1,
    started_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    effective_plan: 'starter',
    plan_source: 'alpha_override',
    focus_track_id: 'track-a-first-agent',
    xp: 25,
    started_lesson_ids: [],
    completed_lesson_ids: [],
    earned_badge_ids: ['account-created'],
    unlocked_level_ids: [0],
    milestone_ids: ['account-created'],
    events: [],
    alert_config: {
      enabled: false,
      monthly_budget_usd: 25,
      notify_email: true,
      notify_webhook: false,
    },
    approval_gate: {
      enabled: false,
      risky_action: 'deployment_change',
      pending_requests: [],
      last_reviewed_at: null,
    },
    tutor: {
      free_questions_remaining: 5,
      questions_asked: 0,
      escalations: 0,
      history: [],
    },
  }
}

export function normalizePicoState(payload: unknown): PicoProductState {
  const defaults = createDefaultPicoState()
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return defaults
  }

  const state = payload as Partial<PicoProductState>
  return {
    ...defaults,
    ...state,
    focus_track_id: state.focus_track_id || defaults.focus_track_id,
    xp: Math.max(Number(state.xp ?? defaults.xp), 0),
    started_lesson_ids: Array.isArray(state.started_lesson_ids) ? state.started_lesson_ids.map(String) : defaults.started_lesson_ids,
    completed_lesson_ids: Array.isArray(state.completed_lesson_ids) ? state.completed_lesson_ids.map(String) : defaults.completed_lesson_ids,
    earned_badge_ids: Array.isArray(state.earned_badge_ids) ? state.earned_badge_ids.map(String) : defaults.earned_badge_ids,
    unlocked_level_ids: Array.isArray(state.unlocked_level_ids) ? state.unlocked_level_ids.map((value) => Number(value)) : defaults.unlocked_level_ids,
    milestone_ids: Array.isArray(state.milestone_ids) ? state.milestone_ids.map(String) : defaults.milestone_ids,
    events: Array.isArray(state.events) ? state.events : defaults.events,
    alert_config: {
      ...defaults.alert_config,
      ...(state.alert_config || {}),
      monthly_budget_usd: Number(state.alert_config?.monthly_budget_usd ?? defaults.alert_config.monthly_budget_usd),
    },
    approval_gate: {
      ...defaults.approval_gate,
      ...(state.approval_gate || {}),
      pending_requests: Array.isArray(state.approval_gate?.pending_requests)
        ? state.approval_gate.pending_requests
        : defaults.approval_gate.pending_requests,
    },
    tutor: {
      ...defaults.tutor,
      ...(state.tutor || {}),
      questions_asked: Number(state.tutor?.questions_asked ?? defaults.tutor.questions_asked),
      free_questions_remaining: Number(
        state.tutor?.free_questions_remaining ?? defaults.tutor.free_questions_remaining,
      ),
      escalations: Number(state.tutor?.escalations ?? defaults.tutor.escalations),
      history: Array.isArray(state.tutor?.history) ? state.tutor.history : defaults.tutor.history,
    },
  }
}

export function getLevelForXp(xp: number) {
  let levelIndex = 0
  for (let index = 0; index < levelThresholds.length; index += 1) {
    if (xp >= levelThresholds[index]) {
      levelIndex = index
    }
  }
  return picoLevels[Math.min(levelIndex, picoLevels.length - 1)]
}

export function getProgressSummary(state: PicoProductState): PicoProgressSummary {
  const currentLevel = getLevelForXp(state.xp)
  const nextLevel = picoLevels.find((level) => level.id === currentLevel.id + 1) || null
  const levelStart = levelThresholds[currentLevel.id] || 0
  const levelEnd = nextLevel ? levelThresholds[nextLevel.id] : state.xp
  const currentLevelProgress = nextLevel && levelEnd > levelStart
    ? Math.min(((state.xp - levelStart) / (levelEnd - levelStart)) * 100, 100)
    : 100

  const completed = new Set(state.completed_lesson_ids)
  const nextLesson = picoLessons.find((lesson) => !completed.has(lesson.id)) || null
  const completedTrackIds = picoTracks
    .filter((track) => track.lessonIds.every((lessonId) => completed.has(lessonId)))
    .map((track) => track.id)

  return {
    xp: state.xp,
    completedLessons: completed.size,
    totalLessons: picoLessons.length,
    currentLevel,
    nextLevel,
    currentLevelProgress,
    nextLesson,
    completedTrackIds,
  }
}

export function markLessonStarted(state: PicoProductState, lessonId: string): PicoProductState {
  if (state.started_lesson_ids.includes(lessonId)) {
    return state
  }

  const nextStartedLessonIds = [...state.started_lesson_ids, lessonId]
  return {
    ...state,
    started_lesson_ids: nextStartedLessonIds,
    updated_at: new Date().toISOString(),
    events: [
      ...state.events,
      {
        id: `${lessonId}-started`,
        type: 'tutorial_started',
        summary: `Started ${lessonId}.`,
        created_at: new Date().toISOString(),
        status: 'completed',
        metadata: { lesson_id: lessonId },
      },
    ],
  }
}

export function markLessonCompleted(state: PicoProductState, lessonId: string): PicoProductState {
  if (state.completed_lesson_ids.includes(lessonId)) {
    return state
  }

  const lesson = picoLessonById[lessonId]
  if (!lesson) {
    return state
  }

  const completedLessonIds = [...state.completed_lesson_ids, lessonId]
  const startedLessonIds = state.started_lesson_ids.includes(lessonId)
    ? state.started_lesson_ids
    : [...state.started_lesson_ids, lessonId]
  const xp = state.xp + lesson.xpReward
  const unlockedLevelIds = Array.from(new Set([
    ...state.unlocked_level_ids,
    ...picoLevels.filter((level) => level.id <= getLevelForXp(xp).id).map((level) => level.id),
  ])).sort((left, right) => left - right)
  const earnedBadgeIds = Array.from(new Set([
    ...state.earned_badge_ids,
    `${lesson.trackId}-progress`,
    lessonId,
  ]))

  return {
    ...state,
    xp,
    started_lesson_ids: startedLessonIds,
    completed_lesson_ids: completedLessonIds,
    unlocked_level_ids: unlockedLevelIds,
    earned_badge_ids: earnedBadgeIds,
    milestone_ids: Array.from(new Set([...state.milestone_ids, lessonId])),
    updated_at: new Date().toISOString(),
    events: [
      ...state.events,
      {
        id: `${lessonId}-completed`,
        type: 'tutorial_completed',
        summary: `Completed ${lesson.title}.`,
        created_at: new Date().toISOString(),
        status: 'completed',
        metadata: { lesson_id: lessonId, xp_awarded: lesson.xpReward },
      },
      {
        id: `${lessonId}-xp`,
        type: 'xp_awarded',
        summary: `Awarded ${lesson.xpReward} XP.`,
        created_at: new Date().toISOString(),
        status: 'completed',
        metadata: { lesson_id: lessonId, xp_awarded: lesson.xpReward },
      },
    ],
  }
}

export function getTrackProgress(state: PicoProductState, trackId: string) {
  const track = picoTracks.find((item) => item.id === trackId)
  if (!track) {
    return { completed: 0, total: 0, percent: 0 }
  }

  const completed = track.lessonIds.filter((lessonId) => state.completed_lesson_ids.includes(lessonId)).length
  return {
    completed,
    total: track.lessonIds.length,
    percent: track.lessonIds.length > 0 ? Math.round((completed / track.lessonIds.length) * 100) : 0,
  }
}
