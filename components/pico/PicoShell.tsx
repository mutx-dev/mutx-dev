'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { picoHref } from '@/lib/pico/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Landing' },
  { href: '/onboarding', label: 'Start' },
  { href: '/academy', label: 'Academy' },
  { href: '/tutor', label: 'Tutor' },
  { href: '/autopilot', label: 'Autopilot' },
  { href: '/support', label: 'Support' },
]

type PicoShellProps = {
  eyebrow?: string
  title: string
  description: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export function PicoShell({ eyebrow, title, description, actions, children }: PicoShellProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-5 shadow-[0_24px_80px_rgba(2,8,23,0.35)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <Link href={picoHref(pathname, '/')} className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-200">PM</span>
                PicoMUTX
              </Link>
              {eyebrow ? <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{eyebrow}</p> : null}
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">{description}</p>
              </div>
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>
          <nav className="mt-5 flex flex-wrap gap-2">
            {navItems.map((item) => {
              const active = pathname === `/pico${item.href === '/' ? '' : item.href}`
              return (
                <Link
                  key={item.href}
                  href={picoHref(pathname, item.href)}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm transition',
                    active
                      ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-100'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10 hover:text-white'
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </header>

        <main className="mt-6 flex-1">{children}</main>
      </div>
    </div>
  )
}
