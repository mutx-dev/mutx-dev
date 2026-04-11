'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, Circle, Clock3, ShieldCheck, Sparkles } from 'lucide-react'

import { ApiRequestError, readJson, writeJson } from '@/components/app/http'
import { type PicoProductState, picoLessonById, picoLessonBySlug, picoTracks } from '@/lib/pico/catalog'
import { usePicoHref } from '@/lib/pico/navigation'
import { markLessonCompleted, markLessonStarted, normalizePicoState } from '@/lib/pico/progress'

type PicoStateEnvelope = {
  state: PicoProductState
}

export function PicoLessonPage({ slug }: { slug: string }) {
  const toHref = usePicoHref()
  const lesson = picoLessonBySlug[slug]
  const [state, setState] = useState<PicoProductState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [authRequired, setAuthRequired] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const track = useMemo(
    () => picoTracks.find((item) => item.id === lesson?.trackId) || null,
    [lesson],
  )

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!lesson) {
        setLoading(false)
        return
      }

      try {
        const payload = await readJson<PicoStateEnvelope>('/api/pico/state')
        if (!cancelled) {
          setState(normalizePicoState(payload.state))
        }
      } catch (loadError) {
        if (cancelled) return
        if (loadError instanceof ApiRequestError && (loadError.status === 401 || loadError.status === 403)) {
          setAuthRequired(true)
        } else {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load lesson state')
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
  }, [lesson])

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
      setState(normalizePicoState(payload.state))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save lesson state')
    } finally {
      setSaving(false)
    }
  }

  if (!lesson) {
    return (
      <div className='mx-auto max-w-4xl px-6 py-16 text-white'>
        <div className='rounded-3xl border border-white/10 bg-[#08101d] p-8'>
          Lesson not found. That means the catalog is lying and needs fixing.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className='mx-auto max-w-4xl px-6 py-16 text-white'>
        <div className='rounded-3xl border border-white/10 bg-[#08101d] p-8'>Loading lesson...</div>
      </div>
    )
  }

  if (authRequired || !state) {
    return (
      <div className='mx-auto max-w-4xl px-6 py-16 text-white'>
        <div className='rounded-3xl border border-white/10 bg-[#08101d] p-8'>
          <h1 className='text-3xl font-semibold'>Sign in to track progress</h1>
          <p className='mt-3 text-white/65'>Sign in to read the full lesson, save completion, and earn XP inside the Pico workspace.</p>
          <div className='mt-6 flex gap-3'>
            <Link href='/login' className='rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-medium text-slate-950'>Sign in</Link>
            <Link href={toHref('/app')} className='rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/90'>Back to workspace</Link>
          </div>
        </div>
      </div>
    )
  }

  const started = state.started_lesson_ids.includes(lesson.id)
  const completed = state.completed_lesson_ids.includes(lesson.id)

  return (
    <div className='mx-auto flex max-w-5xl flex-col gap-6 px-6 py-12 text-white'>
      <div className='flex items-center justify-between gap-4'>
        <Link href={toHref('/app')} className='inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm text-white/85'>
          <ArrowLeft className='h-4 w-4' /> Back to workspace
        </Link>
        <div className='text-sm text-white/50'>{saving ? 'Saving...' : 'Saved'}</div>
      </div>

      <section className='rounded-[32px] border border-white/10 bg-[#08101d] p-8'>
        <div className='mb-4 flex flex-wrap gap-2 text-xs text-white/50'>
          <span className='rounded-full border border-white/10 px-3 py-1'>Level {lesson.level}</span>
          <span className='rounded-full border border-white/10 px-3 py-1'>{lesson.estimatedMinutes} min</span>
          <span className='rounded-full border border-white/10 px-3 py-1'>XP {lesson.xpReward}</span>
          {track ? <span className='rounded-full border border-white/10 px-3 py-1'>{track.title}</span> : null}
        </div>
        <h1 className='text-4xl font-semibold tracking-tight'>{lesson.title}</h1>
        <p className='mt-4 max-w-3xl text-base text-white/70'>{lesson.summary}</p>
        <div className='mt-6 grid gap-4 md:grid-cols-3'>
          <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
            <div className='text-xs uppercase tracking-[0.2em] text-white/40'>Objective</div>
            <div className='mt-2 text-sm text-white/85'>{lesson.objective}</div>
          </div>
          <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
            <div className='text-xs uppercase tracking-[0.2em] text-white/40'>Outcome</div>
            <div className='mt-2 text-sm text-white/85'>{lesson.outcome}</div>
          </div>
          <div className='rounded-2xl border border-white/10 bg-white/5 p-4'>
            <div className='text-xs uppercase tracking-[0.2em] text-white/40'>Status</div>
            <div className='mt-2 flex items-center gap-2 text-sm text-white/85'>
              {completed ? <CheckCircle2 className='h-4 w-4 text-emerald-300' /> : started ? <Clock3 className='h-4 w-4 text-cyan-300' /> : <Circle className='h-4 w-4 text-white/40' />}
              {completed ? 'Completed' : started ? 'Started' : 'Not started'}
            </div>
          </div>
        </div>

        <div className='mt-6 flex flex-wrap gap-3'>
          <button onClick={() => void persist(markLessonStarted(state, lesson.id))} className='rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100'>
            {started ? 'Lesson started' : 'Start lesson'}
          </button>
          <button onClick={() => void persist(markLessonCompleted(state, lesson.id))} className='rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100'>
            {completed ? 'Lesson completed' : 'Mark complete'}
          </button>
          {lesson.nextLessonId && picoLessonById[lesson.nextLessonId] ? (
            <Link href={toHref(`/app/lessons/${picoLessonById[lesson.nextLessonId].slug}`)} className='rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/85'>
              Next lesson
            </Link>
          ) : null}
        </div>
      </section>

      {error ? <div className='rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100'>{error}</div> : null}

      <section className='grid gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
        <div className='rounded-[28px] border border-white/10 bg-[#08101d] p-6'>
          <h2 className='text-2xl font-semibold'>Steps</h2>
          <div className='mt-5 space-y-4'>
            {lesson.steps.map((step, index) => (
              <div key={step.title} className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                <div className='text-xs uppercase tracking-[0.2em] text-white/40'>Step {index + 1}</div>
                <h3 className='mt-2 text-lg font-semibold'>{step.title}</h3>
                <p className='mt-2 text-sm text-white/70'>{step.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className='space-y-6'>
          <div className='rounded-[28px] border border-white/10 bg-[#08101d] p-6'>
            <h2 className='text-2xl font-semibold'>Prerequisites</h2>
            <ul className='mt-4 space-y-3 text-sm text-white/75'>
              {lesson.prerequisites.map((item) => (
                <li key={item} className='flex gap-2'>
                  <Sparkles className='mt-0.5 h-4 w-4 text-cyan-300' />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className='rounded-[28px] border border-white/10 bg-[#08101d] p-6'>
            <h2 className='text-2xl font-semibold'>Validation</h2>
            <ul className='mt-4 space-y-3 text-sm text-white/75'>
              {lesson.validation.map((item) => (
                <li key={item} className='flex gap-2'>
                  <CheckCircle2 className='mt-0.5 h-4 w-4 text-emerald-300' />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className='rounded-[28px] border border-white/10 bg-[#08101d] p-6'>
            <h2 className='text-2xl font-semibold'>Troubleshooting</h2>
            <ul className='mt-4 space-y-3 text-sm text-white/75'>
              {lesson.troubleshooting.map((item) => (
                <li key={item} className='flex gap-2'>
                  <ShieldCheck className='mt-0.5 h-4 w-4 text-amber-300' />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className='rounded-[28px] border border-white/10 bg-[#08101d] p-6'>
        <h2 className='text-2xl font-semibold'>Ground truth docs</h2>
        <div className='mt-4 grid gap-3 md:grid-cols-2'>
          {lesson.docLinks.map((doc) => (
            <Link key={doc.href} href={doc.href} className='rounded-2xl border border-white/10 bg-white/5 p-4'>
              <div className='text-sm font-medium text-white'>{doc.label}</div>
              <div className='mt-1 text-xs text-white/45'>{doc.sourcePath}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
