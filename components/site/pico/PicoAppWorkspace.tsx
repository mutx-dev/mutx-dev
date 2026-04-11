'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  Circle,
  Gauge,
  GraduationCap,
  Shield,
  Sparkles,
  Wallet,
} from 'lucide-react'

import { ApiRequestError, normalizeCollection, readJson, writeJson } from '@/components/app/http'
import {
  type PicoProductState,
  picoLessons,
  picoLevels,
  picoPlanFeatures,
  picoTracks,
} from '@/lib/pico/catalog'
import { usePicoHref } from '@/lib/pico/navigation'
import {
  getProgressSummary,
  getTrackProgress,
  markLessonCompleted,
  markLessonStarted,
  normalizePicoState,
} from '@/lib/pico/progress'
import type { PicoTutorReply } from '@/lib/pico/tutor'

type PicoStateEnvelope = {
  state: PicoProductState
}

type PicoTutorEnvelope = {
  reply: PicoTutorReply
}

type OverviewResource<T = unknown> = {
  status?: 'ok' | 'auth_error' | 'error'
  statusCode?: number
  data?: T | null
  error?: string | null
}

type DashboardOverviewPayload = {
  session?: {
    name?: string
    email?: string
    plan?: string
  }
  resources?: {
    agents?: OverviewResource<unknown>
    deployments?: OverviewResource<unknown>
    runs?: OverviewResource<{ items?: Array<{ status?: string }> }>
    alerts?: OverviewResource<{ items?: Array<{ resolved?: boolean }> }>
    budget?: OverviewResource<unknown>
    runtime?: OverviewResource<{ status?: string; label?: string; last_seen_at?: string | null; stale?: boolean }>
    onboarding?: OverviewResource<{ status?: string; current_step?: string }>
  }
}

function pillTone(completed: boolean) {
  return completed
    ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
    : 'border-white/10 bg-white/5 text-white/70'
}

function metricTone(ok: boolean) {
  return ok
    ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
    : 'border-amber-400/40 bg-amber-500/10 text-amber-100'
}

export function PicoAppWorkspace() {
  const toHref = usePicoHref()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [authRequired, setAuthRequired] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<PicoProductState | null>(null)
  const [overview, setOverview] = useState<DashboardOverviewPayload | null>(null)
  const [budgetDraft, setBudgetDraft] = useState('25')
  const [tutorQuestion, setTutorQuestion] = useState('')
  const [tutorReply, setTutorReply] = useState<PicoTutorReply | null>(null)
  const [tutorLoading, setTutorLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      setAuthRequired(false)

      try {
        const [statePayload, overviewPayload] = await Promise.all([
          readJson<PicoStateEnvelope>('/api/pico/state'),
          readJson<DashboardOverviewPayload>('/api/dashboard/overview').catch(() => null),
        ])

        if (cancelled) {
          return
        }

        const normalizedState = normalizePicoState(statePayload.state)
        setState(normalizedState)
        setBudgetDraft(String(normalizedState.alert_config.monthly_budget_usd))
        setOverview(overviewPayload)
      } catch (loadError) {
        if (cancelled) {
          return
        }

        if (loadError instanceof ApiRequestError && (loadError.status === 401 || loadError.status === 403)) {
          setAuthRequired(true)
        } else {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load Pico workspace')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const progress = useMemo(() => (state ? getProgressSummary(state) : null), [state])
  const runs = useMemo(() => overview?.resources?.runs?.data?.items ?? [], [overview])
  const alerts = useMemo(() => overview?.resources?.alerts?.data?.items ?? [], [overview])
  const agents = useMemo(
    () => normalizeCollection<Record<string, unknown>>(overview?.resources?.agents?.data, ['agents', 'items', 'data']),
    [overview],
  )
  const unresolvedAlerts = alerts.filter((alert) => !alert?.resolved).length
  const runtimeStatus = overview?.resources?.runtime?.data?.status ?? 'no runtime snapshot'
  const onboardingStatus = overview?.resources?.onboarding?.data?.status ?? 'not started'

  async function persist(nextState: PicoProductState) {
    setSaving(true)
    setError(null)
    try {
      const payload = await writeJson<PicoStateEnvelope>('/api/pico/state', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ replace: true, patch: nextState }),
      })
      const normalized = normalizePicoState(payload.state)
      setState(normalized)
      setBudgetDraft(String(normalized.alert_config.monthly_budget_usd))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save Pico state')
    } finally {
      setSaving(false)
    }
  }

  async function handleStartLesson(lessonId: string) {
    if (!state) return
    await persist(markLessonStarted(state, lessonId))
  }

  async function handleCompleteLesson(lessonId: string) {
    if (!state) return
    await persist(markLessonCompleted(state, lessonId))
  }

  async function handleSaveControls() {
    if (!state) return
    await persist({
      ...state,
      alert_config: {
        ...state.alert_config,
        monthly_budget_usd: Number(budgetDraft) || state.alert_config.monthly_budget_usd,
      },
    })
  }

  async function handleToggleApprovalGate() {
    if (!state) return
    await persist({
      ...state,
      approval_gate: {
        ...state.approval_gate,
        enabled: !state.approval_gate.enabled,
      },
    })
  }

  async function handleAskTutor() {
    if (!tutorQuestion.trim() || !state) return

    setTutorLoading(true)
    setTutorReply(null)
    setError(null)

    try {
      const payload = await writeJson<PicoTutorEnvelope>('/api/pico/tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: tutorQuestion }),
      })
      setTutorReply(payload.reply)

      const nextState: PicoProductState = {
        ...state,
        tutor: {
          ...state.tutor,
          questions_asked: state.tutor.questions_asked + 1,
          free_questions_remaining: Math.max(state.tutor.free_questions_remaining - 1, 0),
          history: [
            ...state.tutor.history,
            {
              question: tutorQuestion,
              answer_title: payload.reply.title,
              created_at: new Date().toISOString(),
            },
          ],
        },
      }
      await persist(nextState)
    } catch (tutorError) {
      setError(tutorError instanceof Error ? tutorError.message : 'Tutor request failed')
    } finally {
      setTutorLoading(false)
    }
  }

  if (loading) {
    return (
      <div className='mx-auto max-w-7xl px-6 py-20 text-white'>
        <div className='rounded-3xl border border-white/10 bg-white/5 p-8'>Loading Pico workspace...</div>
      </div>
    )
  }

  if (authRequired || !state || !progress) {
    return (
      <div className='mx-auto max-w-5xl px-6 py-20 text-white'>
        <div className='rounded-3xl border border-white/10 bg-[#08101d] p-10 shadow-2xl shadow-black/30'>
          <div className='mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-cyan-200'>
            <GraduationCap className='h-3.5 w-3.5' /> Pico workspace
          </div>
          <h1 className='text-4xl font-semibold tracking-tight'>Sign in to start the real product.</h1>
          <p className='mt-4 max-w-2xl text-base text-white/70'>
            The landing page is theory. The workspace is where progress, tutorials, tutor help, and autopilot state actually live.
          </p>
          <div className='mt-8 flex flex-wrap gap-3'>
            <Link href='/login' className='inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-medium text-slate-950'>
              Sign in
              <ArrowRight className='h-4 w-4' />
            </Link>
            <Link href='/register' className='inline-flex items-center gap-2 rounded-2xl border border-white/15 px-4 py-3 text-sm font-medium text-white'>
              Create account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='bg-[#050b14] text-white'>
      <div className='mx-auto flex max-w-7xl flex-col gap-10 px-6 py-12'>
        <section className='rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(180deg,rgba(10,18,31,0.96),rgba(6,11,20,0.96))] p-8 shadow-2xl shadow-black/30'>
          <div className='flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between'>
            <div className='max-w-3xl'>
              <div className='mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-emerald-200'>
                <Sparkles className='h-3.5 w-3.5' />
                PicoMUTX alpha workspace
              </div>
              <h1 className='text-4xl font-semibold tracking-tight'>Go from zero to a production agent you trust.</h1>
              <p className='mt-4 text-base text-white/70'>
                Learn, build, and operate in one loop. No fake academy slides. No fake dashboard theater. Just the narrow path that gets one useful agent into production.
              </p>
              <div className='mt-6 flex flex-wrap gap-2 text-xs text-white/60'>
                <span className='rounded-full border border-white/10 px-3 py-1'>effective plan: {state.effective_plan}</span>
                <span className='rounded-full border border-white/10 px-3 py-1'>plan source: {state.plan_source}</span>
                <span className='rounded-full border border-white/10 px-3 py-1'>saving: {saving ? 'in progress' : 'idle'}</span>
              </div>
            </div>
            <div className='grid min-w-[280px] gap-3 sm:grid-cols-2'>
              <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                <div className='text-xs uppercase tracking-[0.2em] text-white/45'>XP</div>
                <div className='mt-2 text-3xl font-semibold'>{progress.xp}</div>
                <div className='mt-1 text-sm text-white/60'>{progress.completedLessons}/{progress.totalLessons} lessons completed</div>
              </div>
              <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                <div className='text-xs uppercase tracking-[0.2em] text-white/45'>Current level</div>
                <div className='mt-2 text-xl font-semibold'>{progress.currentLevel.title}</div>
                <div className='mt-1 text-sm text-white/60'>Progress {Math.round(progress.currentLevelProgress)}%</div>
              </div>
            </div>
          </div>

          <div className='mt-8 grid gap-4 lg:grid-cols-4'>
            <div className={`rounded-2xl border p-4 ${metricTone(agents.length > 0)}`}>
              <div className='flex items-center gap-2 text-sm'><Bot className='h-4 w-4' /> Agents</div>
              <div className='mt-3 text-2xl font-semibold'>{agents.length}</div>
              <div className='mt-1 text-sm text-white/70'>Tracked agents visible in MUTX.</div>
            </div>
            <div className={`rounded-2xl border p-4 ${metricTone(runs.length > 0)}`}>
              <div className='flex items-center gap-2 text-sm'><Gauge className='h-4 w-4' /> Runs</div>
              <div className='mt-3 text-2xl font-semibold'>{runs.length}</div>
              <div className='mt-1 text-sm text-white/70'>Recent run visibility in autopilot.</div>
            </div>
            <div className={`rounded-2xl border p-4 ${metricTone(unresolvedAlerts === 0)}`}>
              <div className='flex items-center gap-2 text-sm'><AlertTriangle className='h-4 w-4' /> Alerts</div>
              <div className='mt-3 text-2xl font-semibold'>{unresolvedAlerts}</div>
              <div className='mt-1 text-sm text-white/70'>Unresolved alert pressure right now.</div>
            </div>
            <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
              <div className='flex items-center gap-2 text-sm'><Shield className='h-4 w-4' /> Control state</div>
              <div className='mt-3 text-lg font-semibold'>{state.approval_gate.enabled ? 'Gate enabled' : 'Gate disabled'}</div>
              <div className='mt-1 text-sm text-white/60'>Threshold ${state.alert_config.monthly_budget_usd} / runtime {runtimeStatus}</div>
            </div>
          </div>
        </section>

        {error ? (
          <div className='rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100'>
            {error}
          </div>
        ) : null}

        <section className='grid gap-6 xl:grid-cols-[1.2fr_0.8fr]'>
          <div className='rounded-[28px] border border-white/10 bg-[#08101d] p-6'>
            <div className='mb-5 flex items-center justify-between gap-4'>
              <div>
                <h2 className='text-2xl font-semibold'>Academy levels</h2>
                <p className='mt-1 text-sm text-white/60'>Every lesson ends in an artifact. Dead-end lessons are banned.</p>
              </div>
              {progress.nextLesson ? (
                <Link href={toHref(`/app/lessons/${progress.nextLesson.slug}`)} className='inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/85'>
                  Next lesson
                  <ChevronRight className='h-4 w-4' />
                </Link>
              ) : null}
            </div>
            <div className='grid gap-3'>
              {picoLevels.map((level) => {
                const unlocked = state.unlocked_level_ids.includes(level.id)
                const active = progress.currentLevel.id === level.id
                return (
                  <div key={level.id} className={`rounded-2xl border p-4 ${active ? 'border-emerald-400/40 bg-emerald-500/10' : unlocked ? 'border-white/10 bg-white/5' : 'border-white/5 bg-white/[0.03]'}`}>
                    <div className='flex items-start justify-between gap-4'>
                      <div>
                        <div className='flex items-center gap-2'>
                          {unlocked ? <CheckCircle2 className='h-4 w-4 text-emerald-300' /> : <Circle className='h-4 w-4 text-white/30' />}
                          <h3 className='text-lg font-semibold'>{level.title}</h3>
                        </div>
                        <p className='mt-2 text-sm text-white/65'>{level.objective}</p>
                        <p className='mt-2 text-sm text-white/50'>Outcome: {level.projectOutcome}</p>
                      </div>
                      <div className='rounded-full border border-white/10 px-3 py-1 text-xs text-white/70'>XP {level.xpReward}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className='rounded-[28px] border border-white/10 bg-[#08101d] p-6'>
            <h2 className='text-2xl font-semibold'>Autopilot snapshot</h2>
            <p className='mt-1 text-sm text-white/60'>Real MUTX operational data when it exists. Honest empty states when it does not.</p>
            <div className='mt-5 space-y-3'>
              <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                <div className='text-sm text-white/60'>Runtime</div>
                <div className='mt-1 text-lg font-semibold'>{runtimeStatus}</div>
                <div className='mt-1 text-sm text-white/50'>Onboarding {onboardingStatus}</div>
              </div>
              <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                <div className='text-sm text-white/60'>Runs</div>
                <div className='mt-1 text-lg font-semibold'>{runs.length > 0 ? `${runs.length} recent runs` : 'No recent runs yet'}</div>
                <div className='mt-1 text-sm text-white/50'>This is where the babysitter problem becomes visible.</div>
              </div>
              <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                <div className='text-sm text-white/60'>Alerts</div>
                <div className='mt-1 text-lg font-semibold'>{unresolvedAlerts > 0 ? `${unresolvedAlerts} unresolved` : 'No unresolved alerts'}</div>
                <div className='mt-1 text-sm text-white/50'>Threshold configured at ${state.alert_config.monthly_budget_usd}.</div>
              </div>
            </div>
            <div className='mt-5 flex flex-wrap gap-3'>
              <Link href='/dashboard' className='inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm text-white/85'>Open MUTX dashboard</Link>
              <Link href='/docs/app-dashboard' className='inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm text-white/85'>Read dashboard docs</Link>
            </div>
          </div>
        </section>

        <section className='rounded-[28px] border border-white/10 bg-[#08101d] p-6'>
          <div className='mb-5 flex items-end justify-between gap-4'>
            <div>
              <h2 className='text-2xl font-semibold'>Project tracks</h2>
              <p className='mt-1 text-sm text-white/60'>Choose the narrowest path that gets one agent shipped.</p>
            </div>
            <div className='text-sm text-white/50'>Focus track: {state.focus_track_id}</div>
          </div>
          <div className='grid gap-4 lg:grid-cols-2 xl:grid-cols-3'>
            {picoTracks.map((track) => {
              const trackProgress = getTrackProgress(state, track.id)
              const focused = state.focus_track_id === track.id
              return (
                <div key={track.id} className={`rounded-2xl border p-5 ${focused ? 'border-cyan-400/40 bg-cyan-500/10' : 'border-white/10 bg-white/5'}`}>
                  <div className='flex items-start justify-between gap-4'>
                    <div>
                      <h3 className='text-lg font-semibold'>{track.title}</h3>
                      <p className='mt-2 text-sm text-white/65'>{track.summary}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs ${pillTone(trackProgress.percent === 100)}`}>
                      {trackProgress.completed}/{trackProgress.total}
                    </span>
                  </div>
                  <div className='mt-4 h-2 overflow-hidden rounded-full bg-white/8'>
                    <div className='h-full rounded-full bg-emerald-400' style={{ width: `${trackProgress.percent}%` }} />
                  </div>
                  <p className='mt-3 text-sm text-white/50'>Outcome: {track.outcome}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className='grid gap-6 xl:grid-cols-[1.25fr_0.75fr]'>
          <div className='rounded-[28px] border border-white/10 bg-[#08101d] p-6'>
            <div className='mb-5 flex items-center justify-between gap-4'>
              <div>
                <h2 className='text-2xl font-semibold'>Tutorials</h2>
                <p className='mt-1 text-sm text-white/60'>Short enough to finish. Useful enough to matter.</p>
              </div>
              <div className='text-sm text-white/50'>{progress.completedLessons} completed</div>
            </div>
            <div className='grid gap-4'>
              {picoLessons.map((lesson) => {
                const started = state.started_lesson_ids.includes(lesson.id)
                const completed = state.completed_lesson_ids.includes(lesson.id)
                return (
                  <div key={lesson.id} className='rounded-2xl border border-white/10 bg-white/5 p-5'>
                    <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
                      <div className='max-w-3xl'>
                        <div className='mb-2 flex flex-wrap gap-2 text-xs text-white/50'>
                          <span className='rounded-full border border-white/10 px-2 py-1'>Level {lesson.level}</span>
                          <span className='rounded-full border border-white/10 px-2 py-1'>{lesson.estimatedMinutes} min</span>
                          <span className='rounded-full border border-white/10 px-2 py-1'>XP {lesson.xpReward}</span>
                        </div>
                        <h3 className='text-lg font-semibold'>{lesson.title}</h3>
                        <p className='mt-2 text-sm text-white/65'>{lesson.summary}</p>
                        <p className='mt-2 text-sm text-white/50'>Outcome: {lesson.outcome}</p>
                      </div>
                      <div className='flex flex-wrap gap-2 lg:justify-end'>
                        <Link href={toHref(`/app/lessons/${lesson.slug}`)} className='rounded-2xl border border-white/10 px-3 py-2 text-sm text-white/90'>Open lesson</Link>
                        <button onClick={() => void handleStartLesson(lesson.id)} className='rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100'>
                          {started ? 'Started' : 'Start'}
                        </button>
                        <button onClick={() => void handleCompleteLesson(lesson.id)} className='rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100'>
                          {completed ? 'Completed' : 'Mark complete'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className='space-y-6'>
            <div className='rounded-[28px] border border-white/10 bg-[#08101d] p-6'>
              <h2 className='text-2xl font-semibold'>Tutor</h2>
              <p className='mt-1 text-sm text-white/60'>Grounded help only. Exact lessons and docs, not improvisation theater.</p>
              <textarea
                value={tutorQuestion}
                onChange={(event) => setTutorQuestion(event.target.value)}
                placeholder='Example: my VPS deploy dies after I disconnect. What do I do next?'
                className='mt-4 min-h-[140px] w-full rounded-2xl border border-white/10 bg-[#040913] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30'
              />
              <button
                onClick={() => void handleAskTutor()}
                disabled={tutorLoading}
                className='mt-3 inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-60'
              >
                {tutorLoading ? 'Thinking...' : 'Ask tutor'}
              </button>
              <div className='mt-3 text-xs text-white/45'>Free grounded questions remaining: {state.tutor.free_questions_remaining}</div>
              {tutorReply ? (
                <div className='mt-5 rounded-2xl border border-white/10 bg-white/5 p-4'>
                  <div className='flex items-center justify-between gap-3'>
                    <h3 className='text-lg font-semibold'>{tutorReply.title}</h3>
                    <span className='rounded-full border border-white/10 px-3 py-1 text-xs text-white/70'>{tutorReply.confidence}</span>
                  </div>
                  <p className='mt-2 text-sm text-white/65'>{tutorReply.summary}</p>
                  <div className='mt-4'>
                    <div className='text-xs uppercase tracking-[0.2em] text-white/40'>Next actions</div>
                    <ul className='mt-2 space-y-2 text-sm text-white/80'>
                      {tutorReply.nextActions.map((action) => (
                        <li key={action} className='flex gap-2'>
                          <span className='mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300' />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className='mt-4 grid gap-2'>
                    {tutorReply.lessons.map((lesson) => {
                      const lessonHref = lesson.href.startsWith('/pico')
                        ? toHref(lesson.href.slice('/pico'.length) || '/')
                        : lesson.href.startsWith('/app/')
                          ? toHref(lesson.href)
                          : lesson.href
                      return (
                        <Link key={lesson.id} href={lessonHref} className='rounded-xl border border-white/10 px-3 py-2 text-sm text-white/85'>
                          Lesson: {lesson.title}
                        </Link>
                      )
                    })}
                    {tutorReply.docs.map((doc) => (
                      <Link key={`${doc.href}-${doc.sourcePath}`} href={doc.href} className='rounded-xl border border-white/10 px-3 py-2 text-sm text-white/70'>
                        Doc: {doc.label}
                      </Link>
                    ))}
                  </div>
                  {tutorReply.escalate ? (
                    <div className='mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-100'>
                      Escalate this one. {tutorReply.escalationReason}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className='rounded-[28px] border border-white/10 bg-[#08101d] p-6'>
              <h2 className='text-2xl font-semibold'>Controls</h2>
              <p className='mt-1 text-sm text-white/60'>Simple, honest, and enough for v1.</p>
              <div className='mt-5 space-y-4'>
                <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                  <div className='flex items-center gap-2 text-sm text-white/70'><Wallet className='h-4 w-4' /> Cost threshold</div>
                  <div className='mt-3 flex gap-3'>
                    <input
                      value={budgetDraft}
                      onChange={(event) => setBudgetDraft(event.target.value)}
                      className='w-full rounded-2xl border border-white/10 bg-[#040913] px-4 py-3 text-sm text-white outline-none'
                    />
                    <button onClick={() => void handleSaveControls()} className='rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100'>
                      Save
                    </button>
                  </div>
                </div>
                <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                  <div className='flex items-center justify-between gap-4'>
                    <div>
                      <div className='flex items-center gap-2 text-sm text-white/70'><Shield className='h-4 w-4' /> Approval gate</div>
                      <p className='mt-2 text-sm text-white/55'>Require review before deployment changes in Pico.</p>
                    </div>
                    <button onClick={() => void handleToggleApprovalGate()} className={`rounded-2xl px-4 py-3 text-sm ${state.approval_gate.enabled ? 'border border-emerald-400/30 bg-emerald-500/10 text-emerald-100' : 'border border-white/10 bg-white/5 text-white/85'}`}>
                      {state.approval_gate.enabled ? 'Enabled' : 'Enable gate'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className='rounded-[28px] border border-white/10 bg-[#08101d] p-6'>
              <h2 className='text-2xl font-semibold'>Plan shape</h2>
              <div className='mt-4 grid gap-3'>
                {picoPlanFeatures.map((feature) => (
                  <div key={feature.plan} className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                    <div className='text-lg font-semibold'>{feature.title}</div>
                    <div className='mt-2 text-sm text-white/60'>Tutor: {feature.tutorQuestions}</div>
                    <div className='mt-1 text-sm text-white/60'>Agents: {feature.monitoredAgents}</div>
                    <div className='mt-1 text-sm text-white/60'>Alerts: {feature.alerts}</div>
                    <div className='mt-1 text-sm text-white/60'>Approvals: {feature.approvals}</div>
                    <div className='mt-1 text-sm text-white/60'>Retention: {feature.retention}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
