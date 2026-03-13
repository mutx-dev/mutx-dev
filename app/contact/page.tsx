import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen, Github, Mail, MessageSquareText } from 'lucide-react'

import { ContactLeadForm } from '@/components/ContactLeadForm'
import { WaitlistForm } from '@/components/WaitlistForm'

const GITHUB_URL = 'https://github.com/fortunexbt/mutx-dev'
const DOCS_URL = 'https://docs.mutx.dev'
const CONTACT_EMAIL = 'hello@mutx.dev'

export const metadata: Metadata = {
  title: 'Contact | MUTX',
  description: 'Contact MUTX for demos, hosted access, integrations, and operator workflow questions.',
}

const quickLinks = [
  {
    title: 'Email',
    body: 'If you already know what you need, email the team directly.',
    href: `mailto:${CONTACT_EMAIL}`,
    label: CONTACT_EMAIL,
    icon: Mail,
  },
  {
    title: 'Docs',
    body: 'Inspect the live product surface, API, and operator contract first.',
    href: DOCS_URL,
    label: 'docs.mutx.dev',
    icon: BookOpen,
  },
  {
    title: 'GitHub',
    body: 'Review the actual repo, issues, and shipping state before the call.',
    href: GITHUB_URL,
    label: 'fortunexbt/mutx-dev',
    icon: Github,
  },
]

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-20 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 max-w-3xl">
          <div className="eyebrow mb-5">Contact</div>
          <h1 className="text-4xl font-medium tracking-tight sm:text-6xl">Talk to the team behind MUTX.</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
            Use this page for live demos, hosted access, operator workflow questions, integrations, or enterprise fit checks.
            If you want to inspect the product first, start with the docs and GitHub, then send the exact workflow you want to evaluate.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {quickLinks.map((item) => (
            <a
              key={item.title}
              href={item.href}
              target={item.href.startsWith('http') ? '_blank' : undefined}
              rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
              className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5 transition-colors hover:border-white/20 hover:bg-[#121212]"
            >
              <item.icon className="h-5 w-5 text-white/80" />
              <h2 className="mt-4 text-lg font-medium text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/60">{item.body}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm text-white/80">
                <span>{item.label}</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            </a>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <ContactLeadForm />

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-6">
              <div className="mb-4 flex items-center gap-3">
                <MessageSquareText className="h-5 w-5 text-white/80" />
                <h2 className="text-xl font-medium text-white">Best inbound messages</h2>
              </div>
              <ul className="space-y-3 text-sm leading-6 text-white/60">
                <li>• the exact workflow you want to demo</li>
                <li>• whether you need hosted MUTX or open-source support</li>
                <li>• your team size, runtime, and deployment constraints</li>
                <li>• whether the blocker is dashboard UX, API surface, or production rollout</li>
              </ul>
            </div>

            <WaitlistForm source="contact-page" className="bg-[#0d0d0d]" />

            <div className="flex flex-wrap gap-4 text-sm text-white/60">
              <Link href="/" className="transition-colors hover:text-white">
                Back to mutx.dev
              </Link>
              <a href={DOCS_URL} target="_blank" rel="noreferrer" className="transition-colors hover:text-white">
                Documentation
              </a>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="transition-colors hover:text-white">
                Repository
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
