'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  createDefaultLessonWorkspace,
  type PicoLessonWorkspaceState,
  normalizeLessonWorkspace,
} from '@/lib/pico/platformState'
import { type PicoProgressState } from '@/lib/pico/academy'

const STORAGE_KEY = 'pico.lesson-workspace.v1'

type PicoLessonWorkspaceOptions = {
  progress?: PicoProgressState
  persistRemote?: (lessonSlug: string, workspace: PicoLessonWorkspaceState) => void
}

function readWorkspaceMap() {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeWorkspaceMap(nextMap: Record<string, PicoLessonWorkspaceState>) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextMap))
}

export { createDefaultLessonWorkspace, normalizeLessonWorkspace }

export function readLessonWorkspace(lessonSlug: string, stepCount: number) {
  const workspaceMap = readWorkspaceMap()
  return normalizeLessonWorkspace(workspaceMap[lessonSlug], stepCount)
}

function hasMeaningfulWorkspaceState(workspace: PicoLessonWorkspaceState) {
  return (
    workspace.completedStepIndexes.length > 0 ||
    workspace.notes.trim().length > 0 ||
    workspace.evidence.trim().length > 0 ||
    workspace.updatedAt !== null
  )
}

function getWorkspaceTimestamp(workspace: PicoLessonWorkspaceState) {
  const timestamp = workspace.updatedAt ? Date.parse(workspace.updatedAt) : 0
  return Number.isFinite(timestamp) ? timestamp : 0
}

export function usePicoLessonWorkspace(
  lessonSlug: string,
  stepCount: number,
  options?: PicoLessonWorkspaceOptions,
) {
  const persistedWorkspace = options?.progress?.lessonWorkspaces[lessonSlug]
  const resolvedWorkspace = useMemo(() => {
    if (persistedWorkspace) {
      return normalizeLessonWorkspace(persistedWorkspace, stepCount)
    }

    return readLessonWorkspace(lessonSlug, stepCount)
  }, [lessonSlug, persistedWorkspace, stepCount])
  const [workspace, setWorkspace] = useState<PicoLessonWorkspaceState>(() =>
    createDefaultLessonWorkspace(stepCount),
  )
  const [ready, setReady] = useState(false)
  const workspaceRef = useRef<PicoLessonWorkspaceState>(createDefaultLessonWorkspace(stepCount))
  const workspaceLessonRef = useRef(lessonSlug)

  useEffect(() => {
    const lessonChanged = workspaceLessonRef.current !== lessonSlug
    const currentTimestamp = getWorkspaceTimestamp(workspaceRef.current)
    const resolvedTimestamp = getWorkspaceTimestamp(resolvedWorkspace)

    if (!lessonChanged && currentTimestamp > resolvedTimestamp) {
      setReady(true)
      return
    }

    workspaceLessonRef.current = lessonSlug
    workspaceRef.current = resolvedWorkspace
    setWorkspace(resolvedWorkspace)
    setReady(true)
  }, [lessonSlug, resolvedWorkspace])

  const writePersistedWorkspace = useCallback(
    (nextWorkspace: PicoLessonWorkspaceState) => {
      const workspaceMap = readWorkspaceMap()
      workspaceMap[lessonSlug] = nextWorkspace
      writeWorkspaceMap(workspaceMap)

      options?.persistRemote?.(lessonSlug, nextWorkspace)
    },
    [lessonSlug, options],
  )

  useEffect(() => {
    if (!options?.persistRemote || persistedWorkspace) {
      return
    }

    const legacyWorkspace = readLessonWorkspace(lessonSlug, stepCount)
    if (!hasMeaningfulWorkspaceState(legacyWorkspace)) {
      return
    }

    options.persistRemote(lessonSlug, {
      ...legacyWorkspace,
      updatedAt: legacyWorkspace.updatedAt ?? new Date().toISOString(),
    })
  }, [lessonSlug, options, persistedWorkspace, stepCount])

  const persist = useCallback(
    (nextWorkspace: PicoLessonWorkspaceState) => {
      const normalized = normalizeLessonWorkspace(nextWorkspace, stepCount)
      workspaceLessonRef.current = lessonSlug
      workspaceRef.current = normalized
      setWorkspace(normalized)
      setReady(true)
      writePersistedWorkspace(normalized)
    },
    [lessonSlug, stepCount, writePersistedWorkspace],
  )

  const touch = useCallback(
    (updater: (current: PicoLessonWorkspaceState) => PicoLessonWorkspaceState) => {
      const normalized = normalizeLessonWorkspace(
        {
          ...updater(workspaceRef.current),
          updatedAt: new Date().toISOString(),
        },
        stepCount,
      )

      workspaceLessonRef.current = lessonSlug
      workspaceRef.current = normalized
      setWorkspace(normalized)
      setReady(true)
      writePersistedWorkspace(normalized)
    },
    [lessonSlug, stepCount, writePersistedWorkspace],
  )

  const completedStepCount = workspace.completedStepIndexes.length
  const progressPercent =
    stepCount > 0 ? Math.round((completedStepCount / stepCount) * 100) : 0

  return {
    ready: ready && workspaceLessonRef.current === lessonSlug,
    workspace,
    completedStepCount,
    progressPercent,
    actions: {
      setActiveStep: (index: number) =>
        touch((current) => ({
          ...current,
          activeStepIndex: index,
        })),
      toggleStep: (index: number) =>
        touch((current) => {
          const exists = current.completedStepIndexes.includes(index)
          return {
            ...current,
            completedStepIndexes: exists
              ? current.completedStepIndexes.filter((item) => item !== index)
              : [...current.completedStepIndexes, index].sort((left, right) => left - right),
            activeStepIndex: index,
          }
        }),
      setNotes: (notes: string) =>
        touch((current) => ({
          ...current,
          notes,
        })),
      setEvidence: (evidence: string) =>
        touch((current) => ({
          ...current,
          evidence,
        })),
      reset: () => persist(createDefaultLessonWorkspace(stepCount)),
    },
  }
}
