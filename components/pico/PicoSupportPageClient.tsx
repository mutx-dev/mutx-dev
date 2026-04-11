'use client'

import { useState } from 'react'
import Link from 'next/link'

import { PicoContactForm } from '@/components/pico/PicoContactForm'
import { PicoDisclosure, PicoNowNext } from '@/components/pico/PicoSimpleFlow'
import { PicoShell } from '@/components/pico/PicoShell'
import { usePicoProgress } from '@/components/pico/usePicoProgress'
import { PICO_RELEASE_NOTES, PICO_SHOWCASE_PATTERNS, getLessonBySlug } from '@/lib/pico/academy'
import { usePicoHref } from '@/lib/pico/navigation'

export function PicoSupportPageClient() {
  const { actions } = usePicoProgress()
  const toHref = usePicoHref()
  const [formOpen, setFormOpen] = useState(false)
  const [interest, setInterest] = useState<string | undefined>()

  function openEscalation(defaultInterest: string) {
    setInterest(defaultInterest)
    setFormOpen(true)
    actions.recordSupportRequest()
  }

  return (
    <>
      <PicoContactForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        defaultInterest={interest}
        source={interest === 'Office hours' ? 'pico-office-hours' : 'pico-support'}
      />
      <PicoShell
        eyebrow="Support shell"
        title="Get help without the fluff"
        description="Tutor first. Human escalation second. Keep the path obvious and keep the noise folded away."
        actions={
          <div className="flex flex-wrap gap-3">
            <Link href={toHref('/tutor')} className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950">
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
        <PicoNowNext
          current={{
            label: 'Current step',
            title: 'Ask the tutor for the exact route',
            body: 'Use the grounded lesson corpus first. That is the fastest way to get unstuck without adding support overhead.',
            actions: (
              <Link
                href={toHref('/tutor')}
                className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
              >
                Open tutor
              </Link>
            ),
          }}
          next={{
            label: 'Next step',
            title: 'Escalate when the issue is risky or still broken',
            body: 'If the topic is ambiguous, sensitive, or unresolved after the grounded path, send it to a human with the exact lesson or run ID.',
            actions: (
              <button
                type="button"
                onClick={() => openEscalation('Support escalation')}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
              >
                Open escalation form
              </button>
            ),
          }}
        />

        <section className="mt-6 grid gap-4 xl:grid-cols-3">
          <article className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Lane 01</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Tutor</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">Get lesson routing, troubleshooting, and validation without leaving Pico.</p>
            <Link
              href={toHref('/tutor')}
              className="mt-5 inline-flex rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Ask tutor
            </Link>
          </article>

          <article className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Lane 02</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Human escalation</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">Use the real contact pipeline when the issue is risky, ambiguous, or still busted.</p>
            <button
              type="button"
              onClick={() => openEscalation('Support escalation')}
              className="mt-5 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Escalate now
            </button>
          </article>

          <article className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Lane 03</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Office hours</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">Same escalation path, just with a concrete request and enough context to be useful.</p>
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
          </article>
        </section>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          <PicoDisclosure title="Show release notes" hint="Good to have. Not needed for the next user action.">
            <div className="space-y-3">
              {PICO_RELEASE_NOTES.map((note) => (
                <div key={note.title} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{note.date}</p>
                  <p className="mt-2 font-medium text-white">{note.title}</p>
                  <p className="mt-2">{note.body}</p>
                </div>
              ))}
            </div>
          </PicoDisclosure>

          <PicoDisclosure title="Show example patterns" hint="Useful inspiration, but it should stay off the critical path.">
            <div className="space-y-4">
              {PICO_SHOWCASE_PATTERNS.map((pattern) => {
                const lesson = getLessonBySlug(pattern.lessonSlug)
                return (
                  <article key={pattern.title} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                    <h2 className="text-lg font-semibold text-white">{pattern.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{pattern.summary}</p>
                    {lesson ? (
                      <Link
                        href={toHref(`/academy/${lesson.slug}`)}
                        className="mt-4 inline-flex rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
                      >
                        Open {lesson.title}
                      </Link>
                    ) : null}
                  </article>
                )
              })}
            </div>
          </PicoDisclosure>
        </div>
      </PicoShell>
    </>
  )
}
