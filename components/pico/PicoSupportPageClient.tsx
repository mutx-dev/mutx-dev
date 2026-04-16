'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import { PicoContactForm } from '@/components/pico/PicoContactForm'
import { PicoShell } from '@/components/pico/PicoShell'
import { usePicoProgress } from '@/components/pico/usePicoProgress'
import { usePicoHref } from '@/lib/pico/navigation'

const escalationChecklist = [
  'Say which lesson or Autopilot section you were using.',
  'Paste the exact command, error, or approval problem.',
  'Say the last thing that actually worked.',
]

export function PicoSupportPageClient() {
  const { actions } = usePicoProgress()
  const toHref = usePicoHref()
  const [formOpen, setFormOpen] = useState(false)
  const [interest, setInterest] = useState<string | undefined>()

  function openEscalation(defaultInterest: string) {
    setInterest(defaultInterest)
    setFormOpen(true)
  }

  return (
    <>
      <PicoContactForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        defaultInterest={interest}
        source={interest === 'other' ? 'pico-office-hours' : 'pico-support'}
        onSuccess={() => actions.recordSupportRequest()}
      />
      <PicoShell
        eyebrow='Human help'
        title='Get a human when the product path stops being enough'
        description='Use this only when the tutor and the lesson still leave you stuck. Send one clean escalation with enough context to get an answer fast.'
        actions={
          <div className='flex flex-wrap gap-3'>
            <button
              type='button'
              onClick={() => openEscalation('fixing-existing')}
              className='rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300'
            >
              Get human help
            </button>
            <button
              type='button'
              onClick={() => openEscalation('other')}
              className='rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10'
            >
              Request office hours
            </button>
          </div>
        }
      >
        <section className='grid gap-6 lg:grid-cols-[0.95fr,1.05fr]'>
          <div className='rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]'>
            <div className='mb-4 flex justify-center drop-shadow-[0_0_24px_rgba(74,222,128,0.18)]'>
              <Image src='/pico/mascot/pico-coffee.webp' alt='' width={120} height={120} className='rounded-2xl' />
            </div>
            <p className='text-xs uppercase tracking-[0.24em] text-slate-500'>Before you escalate</p>
            <div className='mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-slate-200'>
              If the next move is still obvious, go back and do it. Human help is for the messy edge, not for skipping the lesson.
            </div>
            <div className='mt-4 space-y-3 text-sm text-slate-300'>
              {escalationChecklist.map((item) => (
                <div key={item} className='rounded-2xl border border-white/10 bg-white/5 p-4'>
                  {item}
                </div>
              ))}
            </div>
            <div className='mt-5 flex flex-wrap gap-3'>
              <Link href={toHref('/tutor')} className='rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200'>
                Try tutor first
              </Link>
              <a
                href='mailto:hello@mutx.dev'
                className='rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200'
              >
                hello@mutx.dev
              </a>
            </div>
          </div>

          <div className='rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]'>
            <p className='text-xs uppercase tracking-[0.24em] text-slate-500'>What happens here</p>
            <div className='mt-4 space-y-4'>
              <div className='rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300'>
                <p className='font-medium text-white'>1. Send one clear problem</p>
                <p className='mt-2'>Do not send a life story. Send the blocker.</p>
              </div>
              <div className='rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300'>
                <p className='font-medium text-white'>2. We reply with the next move</p>
                <p className='mt-2'>The goal is to unblock the product path, not create a support maze.</p>
              </div>
              <div className='rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300'>
                <p className='font-medium text-white'>3. You go back to the lesson or control surface</p>
                <p className='mt-2'>Human help exists to restore momentum, not replace the product.</p>
              </div>
            </div>
            <div className='mt-6 rounded-[24px] border border-white/10 bg-[rgba(3,8,20,0.45)] p-5 text-sm text-slate-300'>
              One help path is enough. Tutor for grounded steps. Human help for the messy stuff. That is the whole model.
            </div>
          </div>
        </section>
      </PicoShell>
    </>
  )
}
