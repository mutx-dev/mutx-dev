'use client'

import { useTranslations } from 'next-intl'

export default function PicoLoading() {
  const t = useTranslations('pico.routeStates.loading')

  return (
    <main
      id="main-content"
      tabIndex={-1}
      data-boundary-surface="pico"
      data-boundary-kind="loading"
      className="grid min-h-svh place-items-center bg-(--pico-bg) px-4 py-8 text-(--pico-text) sm:px-6"
      aria-labelledby="pico-loading-title"
    >
      <div
        className="w-full max-w-5xl border border-(--pico-border) bg-(--pico-bg-panel)"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <header className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-(--pico-border) px-5 font-(--font-mono) text-[10px] font-semibold uppercase tracking-[0.18em] text-(--pico-text-muted) sm:px-8">
          <span>{t('route')}</span>
          <span className="border border-(--pico-accent) px-2.5 py-1 text-(--pico-accent)">
            {t('step')}
          </span>
        </header>

        <div className="grid min-h-120 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex flex-col justify-end px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
            <p className="font-(--font-mono) text-[10px] font-semibold uppercase tracking-[0.18em] text-(--pico-accent)">
              {t('eyebrow')}
            </p>
            <h1
              id="pico-loading-title"
              className="mt-4 max-w-3xl font-(--font-site-body) text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl"
            >
              {t('title')}
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-6 text-(--pico-text-secondary) sm:text-base sm:leading-7">
              {t('body')}
            </p>
          </div>

          <aside className="border-t border-(--pico-border) bg-(--pico-bg-raised) p-6 lg:border-s lg:border-t-0 lg:p-8">
            <p className="font-(--font-mono) text-[10px] font-semibold uppercase tracking-[0.18em] text-(--pico-text-muted)">
              {t('postureLabel')}
            </p>
            <div className="mt-5 flex items-center gap-3 text-sm font-semibold text-(--pico-text)">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 bg-(--pico-accent) shadow-[0_0_18px_rgba(var(--pico-accent-rgb),0.45)] motion-safe:animate-pulse motion-reduce:animate-none"
              />
              {t('waiting')}
            </div>
            <p className="mt-4 text-sm leading-6 text-(--pico-text-muted)">
              {t('postureBody')}
            </p>
          </aside>
        </div>
      </div>
    </main>
  )
}
