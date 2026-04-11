'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { type PicoShareMoment } from '@/lib/pico/academy'

type PicoShareProjectCardProps = {
  shareMoment: PicoShareMoment
  shareHref: string
  shared: boolean
  onShared: (shareId: string) => void
}

type ShareStatus = 'idle' | 'shared' | 'copied' | 'linked' | 'error'

export function PicoShareProjectCard({
  shareMoment,
  shareHref,
  shared,
  onShared,
}: PicoShareProjectCardProps) {
  const [status, setStatus] = useState<ShareStatus>('idle')
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return shareHref
    }

    return new URL(shareHref, window.location.origin).toString()
  }, [shareHref])

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: shareMoment.title,
          text: shareMoment.summary,
          url: shareUrl,
        })
        setStatus('shared')
      } else {
        await navigator.clipboard.writeText(`${shareMoment.summary} ${shareUrl}`)
        setStatus('copied')
      }
      onShared(shareMoment.id)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
      setStatus('error')
    }
  }

  async function handleCopySummary() {
    try {
      await navigator.clipboard.writeText(`${shareMoment.summary} ${shareUrl}`)
      setStatus('copied')
      onShared(shareMoment.id)
    } catch {
      setStatus('error')
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setStatus('linked')
      onShared(shareMoment.id)
    } catch {
      setStatus('error')
    }
  }

  const statusLabel = shared
    ? 'Shared already. Good. Ship the next milestone.'
    : status === 'shared'
      ? 'Native share sent.'
      : status === 'copied'
        ? 'Share summary copied.'
        : status === 'linked'
          ? 'Project link copied.'
          : status === 'error'
            ? 'Share failed. Clipboard probably got weird.'
            : 'Make it stupidly easy to show the win while it still feels fresh.'

  return (
    <section className="rounded-[28px] border border-emerald-400/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(8,15,28,0.96))] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.28)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/80">Share project</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{shareMoment.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">
            Turn the milestone into distribution before the dopamine wears off.
          </p>
        </div>
        <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-emerald-100">
          {shareMoment.milestoneLabel}
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr,1fr,0.8fr]">
        <div className="rounded-[24px] border border-white/10 bg-[rgba(3,8,20,0.42)] p-4 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">What the agent does</p>
          <p className="mt-3 leading-6">{shareMoment.agentDoes}</p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-[rgba(3,8,20,0.42)] p-4 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">What was achieved</p>
          <p className="mt-3 leading-6">{shareMoment.achieved}</p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-[rgba(3,8,20,0.42)] p-4 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Project link</p>
          <p className="mt-3 break-all leading-6 text-emerald-100">{shareUrl}</p>
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border border-white/10 bg-slate-950/70 p-4 text-sm leading-6 text-slate-200">
        {shareMoment.summary} {shareUrl}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleShare()}
          disabled={shared}
          className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {shared ? 'Shared' : 'Share project'}
        </button>
        <button
          type="button"
          onClick={() => void handleCopySummary()}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
        >
          Copy summary
        </button>
        <button
          type="button"
          onClick={() => void handleCopyLink()}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10"
        >
          Copy link
        </button>
        <Link
          href={shareHref}
          className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/15"
        >
          Open project
        </Link>
      </div>

      <p className="mt-4 text-sm text-slate-300">{statusLabel}</p>
    </section>
  )
}
