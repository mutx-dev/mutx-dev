export type PicoLessonWorkspaceState = {
  activeStepIndex: number
  completedStepIndexes: number[]
  notes: string
  evidence: string
  updatedAt: string | null
}

export type PicoPlatformSurface =
  | 'onboarding'
  | 'academy'
  | 'lesson'
  | 'tutor'
  | 'autopilot'
  | 'support'

export type PicoPlatformPreferences = {
  activeSurface: PicoPlatformSurface | null
  lastOpenedLessonSlug: string | null
  railCollapsed: boolean
  helpLaneOpen: boolean
  updatedAt: string | null
}

export function createDefaultLessonWorkspace(stepCount: number): PicoLessonWorkspaceState {
  return {
    activeStepIndex: stepCount > 0 ? 0 : -1,
    completedStepIndexes: [],
    notes: '',
    evidence: '',
    updatedAt: null,
  }
}

function normalizeStepIndex(index: number, stepCount: number) {
  if (stepCount <= 0) {
    return -1
  }

  if (!Number.isFinite(index)) {
    return 0
  }

  return Math.min(Math.max(Math.round(index), 0), stepCount - 1)
}

function normalizePersistedStepIndex(index: unknown) {
  if (typeof index !== 'number' || !Number.isFinite(index)) {
    return 0
  }

  return Math.max(0, Math.round(index))
}

export function normalizeLessonWorkspace(
  candidate: unknown,
  stepCount: number,
): PicoLessonWorkspaceState {
  if (!candidate || typeof candidate !== 'object') {
    return createDefaultLessonWorkspace(stepCount)
  }

  const value = candidate as {
    activeStepIndex?: unknown
    completedStepIndexes?: unknown
    notes?: unknown
    evidence?: unknown
    updatedAt?: unknown
  }

  const completedStepIndexes = Array.isArray(value.completedStepIndexes)
    ? Array.from(
        new Set(
          value.completedStepIndexes.filter(
            (item): item is number =>
              typeof item === 'number' &&
              Number.isInteger(item) &&
              item >= 0 &&
              item < stepCount,
          ),
        ),
      ).sort((left, right) => left - right)
    : []

  return {
    activeStepIndex: normalizeStepIndex(
      typeof value.activeStepIndex === 'number' ? value.activeStepIndex : 0,
      stepCount,
    ),
    completedStepIndexes,
    notes: typeof value.notes === 'string' ? value.notes : '',
    evidence: typeof value.evidence === 'string' ? value.evidence : '',
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null,
  }
}

export function normalizePersistedLessonWorkspace(candidate: unknown): PicoLessonWorkspaceState {
  if (!candidate || typeof candidate !== 'object') {
    return createDefaultLessonWorkspace(0)
  }

  const value = candidate as {
    activeStepIndex?: unknown
    completedStepIndexes?: unknown
    notes?: unknown
    evidence?: unknown
    updatedAt?: unknown
  }

  const completedStepIndexes = Array.isArray(value.completedStepIndexes)
    ? Array.from(
        new Set(
          value.completedStepIndexes.filter(
            (item): item is number =>
              typeof item === 'number' && Number.isInteger(item) && item >= 0,
          ),
        ),
      ).sort((left, right) => left - right)
    : []

  return {
    activeStepIndex: normalizePersistedStepIndex(value.activeStepIndex),
    completedStepIndexes,
    notes: typeof value.notes === 'string' ? value.notes : '',
    evidence: typeof value.evidence === 'string' ? value.evidence : '',
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null,
  }
}

export function createDefaultPicoPlatformPreferences(): PicoPlatformPreferences {
  return {
    activeSurface: null,
    lastOpenedLessonSlug: null,
    railCollapsed: false,
    helpLaneOpen: false,
    updatedAt: null,
  }
}

export function normalizePicoPlatformPreferences(
  candidate: unknown,
): PicoPlatformPreferences {
  if (!candidate || typeof candidate !== 'object') {
    return createDefaultPicoPlatformPreferences()
  }

  const value = candidate as {
    activeSurface?: unknown
    lastOpenedLessonSlug?: unknown
    railCollapsed?: unknown
    helpLaneOpen?: unknown
    updatedAt?: unknown
  }

  const activeSurface =
    value.activeSurface === 'onboarding' ||
    value.activeSurface === 'academy' ||
    value.activeSurface === 'lesson' ||
    value.activeSurface === 'tutor' ||
    value.activeSurface === 'autopilot' ||
    value.activeSurface === 'support'
      ? value.activeSurface
      : null

  return {
    activeSurface,
    lastOpenedLessonSlug:
      typeof value.lastOpenedLessonSlug === 'string' &&
      value.lastOpenedLessonSlug.trim().length > 0
        ? value.lastOpenedLessonSlug
        : null,
    railCollapsed: Boolean(value.railCollapsed),
    helpLaneOpen: Boolean(value.helpLaneOpen),
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null,
  }
}
