import Image from 'next/image'
import Link from 'next/link'

import { cn } from '@/lib/utils'

const SITE = 'https://mutx.dev'

export function PicoFooter({ className }: { className?: string }) {
  return (
    <footer
      data-testid="pico-footer"
      className={cn(
        'border-t border-[color:var(--pico-border)] bg-[color:var(--pico-bg)] px-4 py-8 sm:px-6 lg:px-8',
        className,
      )}
      style={{ fontFamily: 'var(--font-site-body), sans-serif' }}
    >
      <div className="mx-auto max-w-[var(--pico-shell,72rem)]">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link
            href="/pico"
            className="inline-flex items-center gap-2 text-sm text-[color:var(--pico-text-secondary)] no-underline transition hover:text-[color:var(--pico-text)]"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-[rgba(var(--pico-accent-rgb),0.1)]">
              <Image src="/pico/logo.png" alt="PicoMUTX logo" width={14} height={14} />
            </span>
            PicoMUTX
          </Link>

          <a
            href={`${SITE}/releases`}
            className="text-sm text-[color:var(--pico-text-muted)] no-underline transition hover:text-[color:var(--pico-text-secondary)]"
          >
            Releases
          </a>
          <a
            href="https://docs.mutx.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[color:var(--pico-text-muted)] no-underline transition hover:text-[color:var(--pico-text-secondary)]"
          >
            Docs
          </a>
          <a
            href="https://github.com/mutx-dev/mutx-dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[color:var(--pico-text-muted)] no-underline transition hover:text-[color:var(--pico-text-secondary)]"
          >
            GitHub
          </a>
          <a
            href={`${SITE}/download`}
            className="text-sm text-[color:var(--pico-text-muted)] no-underline transition hover:text-[color:var(--pico-text-secondary)]"
          >
            Download
          </a>
          <a
            href={`${SITE}/privacy-policy`}
            className="text-sm text-[color:var(--pico-text-muted)] no-underline transition hover:text-[color:var(--pico-text-secondary)]"
          >
            Privacy
          </a>
        </div>

        <p className="mt-5 text-xs leading-5 text-[color:var(--pico-text-muted)]">
          © {new Date().getFullYear()} MUTX. PicoMUTX is a learning and operations platform for AI agent builders.
        </p>
      </div>
    </footer>
  )
}
