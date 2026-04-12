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
        borderTop: '1px solid rgba(255, 233, 204, 0.08)',
        background: '#09080b',
        color: 'rgba(232, 221, 203, 0.6)',
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
        <p style={{ margin: '1.2rem 0 0', fontSize: '0.82rem', lineHeight: 1.5, color: 'rgba(188, 172, 149, 0.48)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '1.6rem',
                height: '1.6rem',
                borderRadius: '0.4rem',
                background: 'rgba(255,248,236,0.04)',
                border: '1px solid rgba(255,233,204,0.08)',
              }}
            >
              <Image src="/pico/logo.png" alt="PicoMUTX logo" width={18} height={18} />
            </span>
            {t('copyright')}
          </span>
        </p>
      </div>
    </footer>
  )
}
