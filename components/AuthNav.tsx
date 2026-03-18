'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

export function AuthNav() {
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' })
        setIsAuthenticated(response.ok)
      } catch {
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [pathname])

  const isAuthPage = pathname === '/login' || pathname === '/register'
  const isHomePage = pathname === '/'
  const isDashboardRoute = pathname.startsWith('/dashboard')

  if (isDashboardRoute) {
    return null
  }

  if (loading || isHomePage) {
    return (
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-8 w-8">
              <Image src="/logo.png" alt="MUTX" fill className="object-contain" />
            </div>
            <span className="text-sm font-semibold uppercase tracking-[0.28em] text-white/90">MUTX</span>
          </Link>
        </div>
      </nav>
    )
  }

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-8 w-8">
            <Image src="/logo.png" alt="MUTX" fill className="object-contain" />
          </div>
          <span className="text-sm font-semibold uppercase tracking-[0.28em] text-white/90">MUTX</span>
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link
              href="/app"
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90"
            >
              Dashboard
            </Link>
          ) : !isAuthPage ? (
            <>
              <Link
                href="/login"
                className="text-sm text-white/60 transition hover:text-white"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90"
              >
                Get Started
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  )
}
