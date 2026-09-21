'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function PicoError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('pico.routeStates.error')

  return (
    <main
      id="main-content"
      tabIndex={-1}
      data-boundary-surface="pico"
      data-boundary-kind="error"
      className="grid min-h-svh place-items-center bg-(--pico-bg) px-4 py-8 text-(--pico-text) sm:px-6"
      aria-labelledby="pico-error-title"
    >
      <div
        className="w-full max-w-5xl border border-(--pico-red) bg-(--pico-bg-panel)"
        role="alert"
      >
        <header className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-(--pico-border) px-5 font-(--font-mono) text-[10px] font-semibold uppercase tracking-[0.18em] text-(--pico-text-muted) sm:px-8">
          <span>{t('route')}</span>
          <span className="border border-(--pico-red) px-2.5 py-1 text-(--pico-red)">
            {t('step')}
          </span>
        </header>

        <div className="grid min-h-120 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex flex-col justify-end px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
            <p className="font-(--font-mono) text-[10px] font-semibold uppercase tracking-[0.18em] text-(--pico-red)">
              {t('eyebrow')}
            </p>
            <h1
              id="pico-error-title"
              className="mt-4 max-w-3xl font-(--font-site-body) text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl"
            >
              {t('title')}
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-6 text-(--pico-text-secondary) sm:text-base sm:leading-7">
              {t('body')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-11 items-center justify-center border border-(--pico-accent) bg-(--pico-accent) px-5 font-(--font-mono) text-[11px] font-semibold uppercase tracking-[0.08em] text-(--pico-accent-contrast) transition-colors hover:bg-(--pico-text) focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--pico-text) motion-reduce:transition-none"
              >
                {t('retry')}
              </button>
              <Link
                href="/pico/support"
                className="inline-flex min-h-11 items-center justify-center border border-(--pico-border) bg-transparent px-5 font-(--font-mono) text-[11px] font-semibold uppercase tracking-[0.08em] text-(--pico-text) transition-colors hover:border-(--pico-accent) hover:text-(--pico-accent) focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--pico-text) motion-reduce:transition-none"
              >
                {t('support')}
              </Link>
            </div>
          </div>

          <aside className="border-t border-(--pico-border) bg-(--pico-bg-raised) p-6 lg:border-s lg:border-t-0 lg:p-8">
            <p className="font-(--font-mono) text-[10px] font-semibold uppercase tracking-[0.18em] text-(--pico-text-muted)">
              {t('scopeLabel')}
            </p>
            <p className="mt-5 font-(--font-site-body) text-2xl font-semibold tracking-[-0.04em] text-(--pico-red)">
              {t('scopeTitle')}
            </p>
            <p className="mt-4 text-sm leading-6 text-(--pico-text-muted)">
              {t('scopeBody')}
            </p>
          </aside>
        </div>
      </div>
    </main>
  )
}
