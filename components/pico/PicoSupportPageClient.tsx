'use client'

import { useState } from 'react'
import Link from 'next/link'

import { PicoShell } from '@/components/pico/PicoShell'
import { usePicoProgress } from '@/components/pico/usePicoProgress'
import { PICO_RELEASE_NOTES, PICO_SHOWCASE_PATTERNS, getLessonBySlug } from '@/lib/pico/academy'
import { PicoContactForm } from '@/components/site/pico/PicoContactForm'

export function PicoSupportPageClient() {
  const { actions } = usePicoProgress()
  const [formOpen, setFormOpen] = useState(false)
  const [interest, setInterest] = useState<string | undefined>()

  function openEscalation(defaultInterest: string) {
    setInterest(defaultInterest)
    setFormOpen(true)
    actions.recordSupportRequest()
  }

  return (
    <>
      <PicoContactForm open={formOpen} onClose={() => setFormOpen(false)} defaultInterest={interest} />
      <PicoShell
        eyebrow="Support shell"
        title="Support without the fake community fluff"
        description="Use the tutor first. Escalate when the issue is risky, ambiguous, or still broken after the grounded path."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link href="/tutor" className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950">
              Ask tutor
            </Link>
            <button
              type="button"
              onClick={() => openEscalation('Support escalation')}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              Escalate to human
            </button>
          </div>
        }
      >
        <section className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Support lanes</p>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  Start with the tutor for exact lesson routing and troubleshooting.
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  Escalate through the real contact pipeline when the issue is risky, ambiguous, or still unresolved.
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  Office hours requests use the same escalation path. Keep the ask concrete and include the lesson or run ID.
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => openEscalation('Office hours')}
                  className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
                >
                  Request office hours
                </button>
                <a
                  href="mailto:hello@mutx.dev"
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
                >
                  hello@mutx.dev
                </a>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Release notes</p>
              <div className="mt-4 space-y-3">
                {PICO_RELEASE_NOTES.map((note) => (
                  <div key={note.title} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{note.date}</p>
                    <p className="mt-2 font-medium text-white">{note.title}</p>
                    <p className="mt-2">{note.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Showcase patterns</p>
            <div className="mt-4 space-y-4">
              {PICO_SHOWCASE_PATTERNS.map((pattern) => {
                const lesson = getLessonBySlug(pattern.lessonSlug)
                return (
                  <article key={pattern.title} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                    <h2 className="text-lg font-semibold text-white">{pattern.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{pattern.summary}</p>
                    {lesson ? (
                      <Link href={`/academy/${lesson.slug}`} className="mt-4 inline-flex rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950">
                        Open {lesson.title}
                      </Link>
                    ) : null}
                  </article>
                )
              })}
            </div>
            <div className="mt-6 rounded-[24px] border border-white/10 bg-[rgba(3,8,20,0.45)] p-5 text-sm text-slate-300">
              This is intentionally lightweight. Community is support infrastructure here, not a vanity metric farm.
            </div>
          </div>
        </section>
      </PicoShell>
    </>
  )
}
