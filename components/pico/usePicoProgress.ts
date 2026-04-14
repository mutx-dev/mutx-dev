'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  applyLessonCompleted,
  applyLessonStarted,
  applyMilestone,
  createDefaultPicoProgress,
  derivePicoProgress,
  markProjectShared,
  markSupportRequest,
  markTutorQuestion,
  mergePicoProgress,
  normalizePicoProgress,
  selectTrack,
  updateLessonWorkspace,
  updateAutopilotSettings,
  updatePlatformPreferences,
  type PicoProgressState,
} from '@/lib/pico/academy'

const STORAGE_KEY = 'pico.progress.v1'

type SyncState = 'idle' | 'loading' | 'saving' | 'synced' | 'offline'

function readLocalProgress() {
  if (typeof window === 'undefined') {
    return createDefaultPicoProgress()
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return createDefaultPicoProgress()
  }

  try {
    return normalizePicoProgress(JSON.parse(raw))
  } catch {
    return createDefaultPicoProgress()
  }
}

function writeLocalProgress(progress: PicoProgressState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function shouldSyncHydratedProgress(
  remoteValue: PicoProgressState,
  mergedValue: PicoProgressState
) {
  return JSON.stringify(normalizePicoProgress(remoteValue)) !== JSON.stringify(normalizePicoProgress(mergedValue))
}

export function resolveHydratedPicoProgress(
  remoteValue: PicoProgressState,
  currentLocalValue: PicoProgressState
) {
  return mergePicoProgress(currentLocalValue, remoteValue)
}

export function usePicoProgress() {
  const [progress, setProgress] = useState<PicoProgressState>(() => createDefaultPicoProgress())
  const [ready, setReady] = useState(false)
  const [syncState, setSyncState] = useState<SyncState>('loading')

  const persistRemote = useCallback(async (nextProgress: PicoProgressState) => {
    try {
      setSyncState('saving')
      const response = await fetch('/api/pico/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(nextProgress),
      })

      if (!response.ok) {
        setSyncState(response.status === 401 ? 'offline' : 'idle')
        return
      }

      const payload = normalizePicoProgress(await response.json())
      writeLocalProgress(payload)
      setProgress(payload)
      setSyncState('synced')
    } catch {
      setSyncState('offline')
    }
  }, [])

  useEffect(() => {
    const local = readLocalProgress()
    setProgress(local)
    writeLocalProgress(local)

    async function hydrate() {
      try {
        const response = await fetch('/api/pico/progress', {
          credentials: 'include',
          cache: 'no-store',
        })

        if (!response.ok) {
          setSyncState(response.status === 401 ? 'offline' : 'idle')
          setReady(true)
          return
        }

        const remote = normalizePicoProgress(await response.json())
        const currentLocal = readLocalProgress()
        const merged = resolveHydratedPicoProgress(remote, currentLocal)
        writeLocalProgress(merged)
        setProgress(merged)
        setSyncState('synced')

        if (shouldSyncHydratedProgress(remote, merged)) {
          void persistRemote(merged)
        }
      } catch {
        setSyncState('offline')
      } finally {
        setReady(true)
      }
    }

    void hydrate()
  }, [])

  const update = useCallback(
    (updater: (current: PicoProgressState) => PicoProgressState) => {
      setProgress((current) => {
        const next = normalizePicoProgress(updater(current))
        writeLocalProgress(next)
        void persistRemote(next)
        return next
      })
    },
    [persistRemote]
  )

  const actions = useMemo(
    () => ({
      startLesson: (lessonSlug: string) => update((current) => applyLessonStarted(current, lessonSlug)),
      completeLesson: (lessonSlug: string) =>
        update((current) => applyLessonCompleted(current, lessonSlug)),
      unlockMilestone: (eventId: string) => update((current) => applyMilestone(current, eventId)),
      pickTrack: (trackSlug: string) => update((current) => selectTrack(current, trackSlug)),
      recordTutorQuestion: () => update((current) => markTutorQuestion(current)),
      recordSupportRequest: () => update((current) => markSupportRequest(current)),
      shareProject: (projectId: string) => update((current) => markProjectShared(current, projectId)),
      setLessonWorkspace: (lessonSlug: string, workspace: PicoProgressState['lessonWorkspaces'][string]) =>
        update((current) => updateLessonWorkspace(current, lessonSlug, workspace)),
      setPlatform: (patch: Partial<PicoProgressState['platform']>) =>
        update((current) => updatePlatformPreferences(current, patch)),
      setAutopilot: (patch: Partial<PicoProgressState['autopilot']>) =>
        update((current) => updateAutopilotSettings(current, patch)),
      reset: () => {
        const next = createDefaultPicoProgress()
        writeLocalProgress(next)
        setProgress(next)
        void persistRemote(next)
      },
    }),
    [persistRemote, update]
  )

  const derived = useMemo(() => derivePicoProgress(progress), [progress])

  return {
    ready,
    syncState,
    progress,
    derived,
    actions,
  }
}
