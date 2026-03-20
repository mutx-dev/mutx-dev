'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const APP_LOGIN_URL = 'https://app.mutx.dev/login'
const APP_REGISTER_URL = 'https://app.mutx.dev/register'
const DOCS_URL = 'https://docs.mutx.dev'

export function AuthNav() {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname === '/reset-password'
  const demoAppRoutes = new Set([
    '/',
    '/overview',
    '/agents',
    '/deployments',
    '/runs',
    '/environments',
    '/access',
    '/connectors',
    '/audit',
    '/usage',
    '/settings',
    '/logs',
    '/traces',
    '/memory',
    '/orchestration',
  ])
  const isHiddenRoute =
    demoAppRoutes.has(pathname) || pathname.startsWith('/dashboard') || pathname.startsWith('/app')

  if (isHiddenRoute) {
    return null
  }

  return (
    <nav className="site-topbar">
      <div className="site-shell flex items-center justify-between py-4">
        <Link href="/" className="site-brand">
          <div className="site-brand-mark">
            <Image src="/logo.png" alt="MUTX" fill sizes="2.75rem" className="object-contain p-1.5" />
          </div>
          <div>
            <p className="site-brand-overline">MUTX</p>
            <p className="site-brand-title">control plane for agents with a pulse</p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {!isAuthPage ? (
            <>
              <a href={DOCS_URL} target="_blank" rel="noreferrer" className="site-nav-link hidden sm:block">
                Docs
              </a>
              <a href={APP_LOGIN_URL} className="site-nav-link">
                Sign in
              </a>
              <a href={APP_REGISTER_URL} className="site-button-accent">
                Get started
              </a>
            </>
          ) : (
            <a href={DOCS_URL} target="_blank" rel="noreferrer" className="site-nav-link">
              Docs
            </a>
          )}
        </div>
      </div>
    </nav>
  )
}
