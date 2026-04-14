import { useTranslations } from 'next-intl'
import Image from 'next/image'

import { cn } from '@/lib/utils'
import core from '@/components/site/marketing/MarketingCore.module.css'

const SITE = 'https://mutx.dev'

export function PicoFooter({ className }: { className?: string }) {
  const t = useTranslations('pico.footer')

  return (
    <footer
      data-testid="pico-footer"
      className={cn(className)}
      style={{
        borderTop: '1px solid var(--pico-border)',
        background: 'var(--pico-bg)',
        color: 'var(--pico-text-secondary)',
        padding: 'clamp(2rem, 4vw, 3rem) 0',
        fontFamily: 'var(--font-site-body), sans-serif',
      }}
    >
      <div className={core.shell}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem 1.4rem', alignItems: 'center' }}>
          <a
            href={`${SITE}/releases`}
            style={{ fontSize: '0.85rem', color: 'inherit', textDecoration: 'none' }}
          >
            {t('links.releases')}
          </a>
          <a
            href="https://docs.mutx.dev"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.85rem', color: 'inherit', textDecoration: 'none' }}
          >
            {t('links.docs')}
          </a>
          <a
            href="https://github.com/mutx-dev/mutx-dev"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.85rem', color: 'inherit', textDecoration: 'none' }}
          >
            {t('links.github')}
          </a>
          <a
            href={`${SITE}/download`}
            style={{ fontSize: '0.85rem', color: 'inherit', textDecoration: 'none' }}
          >
            {t('links.download')}
          </a>
          <a
            href={`${SITE}/contact`}
            style={{ fontSize: '0.85rem', color: 'inherit', textDecoration: 'none' }}
          >
            {t('links.contact')}
          </a>
          <a
            href={`${SITE}/privacy-policy`}
            style={{ fontSize: '0.85rem', color: 'inherit', textDecoration: 'none' }}
          >
            {t('links.privacy')}
          </a>
        </div>
        <p style={{ margin: '1.2rem 0 0', fontSize: '0.82rem', lineHeight: 1.5, color: 'var(--pico-text-muted)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '1.9rem',
                height: '1.9rem',
                borderRadius: '0.55rem',
                background: 'linear-gradient(135deg, rgba(var(--pico-accent-rgb), 0.1), rgba(15, 42, 11, 0.72))',
                border: '1px solid var(--pico-border)',
              }}
            >
              <Image src="/pico/logo.png" alt="PicoMUTX logo" width={22} height={22} />
            </span>
            {t('copyright')}
          </span>
        </p>
      </div>
    </footer>
  )
}
