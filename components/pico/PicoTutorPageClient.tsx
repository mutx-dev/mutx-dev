'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'

import { PicoShell } from '@/components/pico/PicoShell'
import { usePicoProgress } from '@/components/pico/usePicoProgress'
import { PICO_LESSONS } from '@/lib/pico/academy'
import { usePicoHref } from '@/lib/pico/navigation'
import type { PicoTutorReply } from '@/lib/pico/tutor'

const examplePrompts = [
  'Hermes launches locally but dies on the VPS. What should I check first?',
  'How do I keep the agent alive after I close SSH?',
  'I want approval before any outbound send. Which lesson do I follow?',
]

type TutorApiResponse = Partial<PicoTutorReply> & {
  detail?: string
}

function isTutorReply(value: TutorApiResponse): value is PicoTutorReply {
  return Boolean(
    typeof value.answer === 'string' &&
      Array.isArray(value.nextActions) &&
      Array.isArray(value.lessons) &&
      Array.isArray(value.docs) &&
      Array.isArray(value.matches),
  )
}

function resolveTutorHref(toHref: ReturnType<typeof usePicoHref>, href: string) {
  if (
    href.startsWith('/pico') ||
    href.startsWith('/docs') ||
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:')
  ) {
    return href
  }
  return toHref(href)
}

export function PicoTutorPageClient() {
  const { progress, actions } = usePicoProgress()
  const toHref = usePicoHref()
  const [question, setQuestion] = useState('')
  const [lessonSlug, setLessonSlug] = useState(
    progress.selectedTrack
      ? PICO_LESSONS.find((lesson) => lesson.track === progress.selectedTrack)?.slug ?? ''
      : '',
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reply, setReply] = useState<PicoTutorReply | null>(null)
  const availableLessons = useMemo(() => PICO_LESSONS, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!question.trim()) return

    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/pico/tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          lessonSlug: lessonSlug || null,
          progress,
        }),
      })
      const payload = (await response.json()) as TutorApiResponse
      if (!response.ok) {
        throw new Error(payload.detail || 'Tutor request failed')
      }
      if (!isTutorReply(payload)) {
        throw new Error('Tutor response came back malformed')
      }

      setReply(payload)
      actions.recordTutorQuestion()
    } catch (submitError) {
      setReply(null)
      setError(submitError instanceof Error ? submitError.message : 'Tutor request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PicoShell
      eyebrow='Grounded tutor'
      title='Ask for the exact next step'
      description='The tutor only answers from the shipped Pico lesson corpus. If confidence is low or the topic is risky, it tells you to escalate instead of pretending to be clever.'
      actions={
        <Link href={toHref('/support')} className='rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10'>
          Open support lane
        </Link>
      }
    >
      <section className='grid gap-6 lg:grid-cols-[1fr,0.9fr]'>
        <form onSubmit={submit} className='rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]'>
          <p className='text-xs uppercase tracking-[0.24em] text-slate-500'>Question</p>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder='Describe the block, the exact step, and what you expected to happen.'
            className='mt-4 min-h-[180px] w-full rounded-[24px] border border-white/10 bg-[rgba(3,8,20,0.45)] px-4 py-4 text-sm text-slate-100 outline-none placeholder:text-slate-500'
          />
          <div className='mt-4 grid gap-4 md:grid-cols-[1fr,auto] md:items-end'>
            <label className='block text-sm text-slate-300'>
              <span className='mb-2 block text-xs uppercase tracking-[0.24em] text-slate-500'>Current lesson</span>
              <select
                value={lessonSlug}
                onChange={(event) => setLessonSlug(event.target.value)}
                className='w-full rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] px-4 py-3 text-sm text-slate-100 outline-none'
              >
                <option value=''>No lesson selected</option>
                {availableLessons.map((lesson) => (
                  <option key={lesson.slug} value={lesson.slug}>
                    {lesson.title}
                  </option>
                ))}
              </select>
            </label>
            <button
              type='submit'
              disabled={loading}
              className='rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60'
            >
              {loading ? 'Thinking from the corpus...' : 'Ask tutor'}
            </button>
          </div>
          <div className='mt-5 flex flex-wrap gap-2'>
            {examplePrompts.map((prompt) => (
              <button
                key={prompt}
                type='button'
                onClick={() => setQuestion(prompt)}
                className='rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300 transition hover:bg-white/10'
              >
                {prompt}
              </button>
            ))}
          </div>
        </form>

        <div className='rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]'>
          <p className='text-xs uppercase tracking-[0.24em] text-slate-500'>Answer</p>
          {error ? (
            <div className='mt-4 rounded-[24px] border border-rose-400/20 bg-rose-400/10 p-5 text-sm leading-6 text-rose-50'>
              {error}
            </div>
          ) : null}
          {reply ? (
            <div className='mt-4 space-y-4'>
              <div className='flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500'>
                <span>{reply.title}</span>
                <span className='rounded-full border border-white/10 px-3 py-1 text-[11px] text-slate-300'>{reply.confidence} confidence</span>
              </div>

              <div className='rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-300'>
                {reply.answer}
              </div>

              {reply.lessons.length ? (
                <div className='flex flex-wrap gap-3'>
                  {reply.lessons.map((lesson) => (
                    <Link
                      key={`${lesson.id}-${lesson.href}`}
                      href={resolveTutorHref(toHref, lesson.href)}
                      className='inline-flex rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950'
                    >
                      Open {lesson.title}
                    </Link>
                  ))}
                </div>
              ) : null}

              <div className='rounded-[24px] border border-white/10 bg-[rgba(3,8,20,0.45)] p-5'>
                <p className='text-sm font-medium text-white'>Next actions</p>
                <div className='mt-3 space-y-2'>
                  {reply.nextActions.map((item) => (
                    <div key={item} className='rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300'>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {reply.docs.length ? (
                <div className='rounded-[24px] border border-white/10 bg-[rgba(3,8,20,0.45)] p-5'>
                  <p className='text-sm font-medium text-white'>Docs and help</p>
                  <div className='mt-3 flex flex-wrap gap-2'>
                    {reply.docs.map((doc) => (
                      <Link
                        key={`${doc.href}-${doc.sourcePath}`}
                        href={resolveTutorHref(toHref, doc.href)}
                        className='rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300 transition hover:bg-white/10'
                      >
                        {doc.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {reply.matches.length ? (
                <div className='rounded-[24px] border border-white/10 bg-[rgba(3,8,20,0.45)] p-5'>
                  <p className='text-sm font-medium text-white'>Matches</p>
                  <div className='mt-3 space-y-2'>
                    {reply.matches.map((match) => (
                      <div key={match.slug} className='rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300'>
                        <p className='font-medium text-white'>{match.title}</p>
                        <p className='mt-1'>{match.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {reply.escalationReason ? (
                <div className='rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-5 text-sm text-amber-50'>
                  Escalation note: {reply.escalationReason}
                  <div className='mt-4'>
                    <Link
                      href={toHref('/support')}
                      className='inline-flex rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950'
                    >
                      Open support lane
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className='mt-4 rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm leading-6 text-slate-300'>
              Ask a concrete question and the tutor will route you to the exact lesson, troubleshooting note, and validation step.
            </div>
          )}
        </div>
      </section>
    </PicoShell>
  )
}
