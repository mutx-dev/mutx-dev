'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
  updateAutopilotSettings,
  type PicoProgressState,
} from '@/lib/pico/academy'
import {
  createDefaultPicoSession,
  createLessonCelebration,
  deriveMomentumCue,
  deriveStreakCue,
  registerPicoSession,
  type PicoLessonCelebration,
  type PicoLocalSession,
  type PicoStreakCue,
} from '@/lib/pico/progressSignals'

const STORAGE_KEY = 'pico.progress.v1'
const SESSION_STORAGE_KEY = 'pico.session.v1'
const FEEDBACK_STORAGE_KEY = 'pico.feedback.v1'
const FEEDBACK_TTL_MS = 1000 * 60 * 30

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

function readLocalSession() {
  if (typeof window === 'undefined') {
    return createDefaultPicoSession()
  }

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY)
  if (!raw) {
    return createDefaultPicoSession()
  }

  try {
    return JSON.parse(raw) as PicoLocalSession
  } catch {
    return createDefaultPicoSession()
  }
}

function writeLocalSession(session: PicoLocalSession) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

function readLocalFeedback() {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(FEEDBACK_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as { createdAt?: string; feedback?: PicoLessonCelebration | null }
    if (!parsed.createdAt || !parsed.feedback) {
      return null
    }

    const ageMs = Date.now() - new Date(parsed.createdAt).getTime()
    if (Number.isNaN(ageMs) || ageMs > FEEDBACK_TTL_MS) {
      window.localStorage.removeItem(FEEDBACK_STORAGE_KEY)
      return null
    }

    return parsed.feedback
  } catch {
    return null
  }
}

function writeLocalFeedback(feedback: PicoLessonCelebration | null) {
  if (typeof window === 'undefined') return

  if (!feedback) {
    window.localStorage.removeItem(FEEDBACK_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(
    FEEDBACK_STORAGE_KEY,
    JSON.stringify({
      createdAt: new Date().toISOString(),
      feedback,
    })
  )
}

export function usePicoProgress() {
  const [progress, setProgress] = useState<PicoProgressState>(() => createDefaultPicoProgress())
  const [ready, setReady] = useState(false)
  const [syncState, setSyncState] = useState<SyncState>('loading')
  const [feedback, setFeedback] = useState<PicoLessonCelebration | null>(null)
  const [session, setSession] = useState<PicoLocalSession>(() => createDefaultPicoSession())
  const [streak, setStreak] = useState<PicoStreakCue>({
    label: 'Session 1',
    body: 'Finish one real step on this device and the progress starts to compound.',
  })
  const progressRef = useRef(progress)

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

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
      progressRef.current = payload
      writeLocalProgress(payload)
      setProgress(payload)
      setSyncState('synced')
    } catch {
      setSyncState('offline')
    }
  }, [])

  useEffect(() => {
    const local = readLocalProgress()
    const sessionUpdate = registerPicoSession(readLocalSession(), new Date())
    const localFeedback = readLocalFeedback()

    progressRef.current = local
    setProgress(local)
    writeLocalProgress(local)
    writeLocalSession(sessionUpdate.session)
    setSession(sessionUpdate.session)
    setStreak(deriveStreakCue(sessionUpdate.session, sessionUpdate.transition))
    setFeedback(localFeedback)

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
        const merged = mergePicoProgress(local, remote)
        progressRef.current = merged
        writeLocalProgress(merged)
        setProgress(merged)
        setSyncState('synced')
      } catch {
        setSyncState('offline')
      } finally {
        setReady(true)
      }
    }

    void hydrate()
  }, [])

  const commitProgress = useCallback(
    (nextProgress: PicoProgressState, nextFeedback: PicoLessonCelebration | null = null) => {
      const normalized = normalizePicoProgress(nextProgress)
      progressRef.current = normalized
      writeLocalProgress(normalized)
      setProgress(normalized)
      if (nextFeedback) {
        writeLocalFeedback(nextFeedback)
        setFeedback(nextFeedback)
      }
      void persistRemote(normalized)
    },
    [persistRemote]
  )

  const update = useCallback(
    (updater: (current: PicoProgressState) => PicoProgressState) => {
      const next = normalizePicoProgress(updater(progressRef.current))
      commitProgress(next)
    },
    [commitProgress]
  )

  const dismissFeedback = useCallback(() => {
    writeLocalFeedback(null)
    setFeedback(null)
  }, [])

  const actions = useMemo(
    () => ({
      startLesson: (lessonSlug: string) => update((current) => applyLessonStarted(current, lessonSlug)),
      completeLesson: (lessonSlug: string) => {
        const current = progressRef.current
        if (current.completedLessons.includes(lessonSlug)) {
          return
        }
        const next = applyLessonCompleted(current, lessonSlug)
        const nextFeedback = createLessonCelebration(current, next, lessonSlug)
        commitProgress(next, nextFeedback)
      },
      unlockMilestone: (eventId: string) => update((current) => applyMilestone(current, eventId)),
      pickTrack: (trackSlug: string) => update((current) => selectTrack(current, trackSlug)),
      recordTutorQuestion: () => update((current) => markTutorQuestion(current)),
      recordSupportRequest: () => update((current) => markSupportRequest(current)),
      shareProject: (projectId: string) => update((current) => markProjectShared(current, projectId)),
      setAutopilot: (patch: Partial<PicoProgressState['autopilot']>) =>
        update((current) => updateAutopilotSettings(current, patch)),
      dismissFeedback,
      reset: () => {
        const next = createDefaultPicoProgress()
        progressRef.current = next
        writeLocalProgress(next)
        writeLocalFeedback(null)
        setFeedback(null)
        setProgress(next)
        void persistRemote(next)
      },
    }),
    [commitProgress, dismissFeedback, persistRemote, update]
  )

  const derived = useMemo(() => derivePicoProgress(progress), [progress])
  const momentum = useMemo(() => deriveMomentumCue(progress), [progress])

  return {
    ready,
    syncState,
    progress,
    derived,
    momentum,
    streak,
    feedback,
    session,
    actions,
  }
}
