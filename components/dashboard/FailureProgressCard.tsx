import Link from 'next/link'
import { ArrowRight, BookOpen, Wrench } from 'lucide-react'

import type { FailureGuidance } from '@/lib/dashboardFailureGuidance'

import { LivePanel } from './livePrimitives'

export function FailureProgressCard({
  guidance,
  signal,
}: {
  guidance: FailureGuidance
  signal?: string | null
}) {
  return (
    <LivePanel title='Failure -> progress' meta={guidance.kind.replaceAll('_', ' ')}>
      <div className='space-y-4'>
        <div className='rounded-[18px] border border-amber-300/20 bg-amber-300/10 p-4'>
          <div className='flex items-start gap-3'>
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-amber-300/25 bg-amber-300/12 text-amber-100'>
              <Wrench className='h-4 w-4' />
            </div>
            <div className='min-w-0'>
              <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100/80'>
                Lesson behind the break
              </p>
              <h3 className='mt-2 text-base font-semibold text-white'>{guidance.title}</h3>
              <p className='mt-2 text-sm leading-6 text-amber-50/90'>{guidance.summary}</p>
              <p className='mt-3 text-sm leading-6 text-amber-100'>{guidance.stageNote}</p>
            </div>
          </div>
        </div>

        <div className='rounded-[18px] border border-white/10 bg-white/[0.03] p-4'>
          <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400'>
            <BookOpen className='h-3.5 w-3.5' />
            <span>Lesson</span>
          </div>
          <Link href={guidance.lesson.href} className='mt-2 inline-flex items-center gap-2 text-sm font-medium text-sky-200 transition hover:text-sky-100'>
            {guidance.lesson.title}
            <ArrowRight className='h-3.5 w-3.5' />
          </Link>
          <p className='mt-2 text-xs leading-5 text-slate-400'>
            Signal: {signal || guidance.detectedFrom}
          </p>
        </div>

        <div className='flex flex-wrap gap-3'>
          <Link
            href={guidance.primaryAction.href}
            className='inline-flex items-center gap-2 rounded-[12px] border border-sky-300/24 bg-sky-300/12 px-3.5 py-2 text-sm font-medium text-sky-100 transition hover:bg-sky-300/18'
          >
            <ArrowRight className='h-4 w-4' />
            {guidance.primaryAction.label}
          </Link>
          {guidance.secondaryAction ? (
            <Link
              href={guidance.secondaryAction.href}
              className='inline-flex items-center gap-2 rounded-[12px] border border-[#2f3c49] bg-[#10161d] px-3.5 py-2 text-sm font-medium text-[#dce3ec] transition hover:border-sky-300/18'
            >
              {guidance.secondaryAction.label}
            </Link>
          ) : null}
        </div>
      </div>
    </LivePanel>
  )
}
