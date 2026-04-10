import Link from 'next/link'
import { ArrowLeft, BookOpen, Compass, Home } from 'lucide-react'

export const metadata = {
  title: '404 - Page Not Found | MUTX',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <main className="min-h-screen bg-black px-6 py-24 text-white">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
          <Compass className="h-3.5 w-3.5" />
          404 · Route not found
        </div>

        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-200">MUTX Webmaster Surface</p>
          <h1 className="text-4xl font-medium tracking-tight sm:text-6xl">This route does not exist.</h1>
          <p className="max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
            The page you requested is missing, moved, or was never part of the public MUTX surface. Use the
            links below to get back to a real product surface.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition-opacity hover:opacity-90"
          >
            <Home className="h-4 w-4" />
            Back to Site
          </Link>
          <a
            href="https://docs.mutx.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <BookOpen className="h-4 w-4" />
            Open Docs
          </a>
          <Link
            href="/privacy-policy"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Privacy Policy
          </Link>
        </div>
      </div>
    </main>
  )
}
