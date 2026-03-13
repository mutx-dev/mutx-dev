import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen, Github, Mail } from 'lucide-react'

import { ContactLeadForm } from '@/components/ContactLeadForm'

const GITHUB_URL = 'https://github.com/fortunexbt/mutx-dev'
const DOCS_URL = 'https://docs.mutx.dev'
const CONTACT_EMAIL = 'hello@mutx.dev'

export const metadata: Metadata = {
  title: 'Contact | MUTX',
  description: 'Institutional contact for MUTX: funding, partnerships, contributions, ideas, demos, and hosted access.',
}

const inquiryTracks = [
  {
    title: 'Funding',
    body: 'Investor conversations, strategic capital, and financing discussions around MUTX as the control plane for AI agents.',
  },
  {
    title: 'Partnerships',
    body: 'Distribution, infrastructure, enterprise, and ecosystem conversations where MUTX should be part of the operating stack.',
  },
  {
    title: 'Contributions',
    body: 'Open-source collaboration across code, docs, design, infrastructure, and operator workflows.',
  },
  {
    title: 'Ideas',
    body: 'Product ideas, design-partner workflows, integration proposals, and gaps worth closing before broader rollout.',
  },
]

const directChannels = [
  {
    title: 'Email',
    body: 'Use direct email if you already know the conversation you want to have.',
    href: `mailto:${CONTACT_EMAIL}`,
    label: CONTACT_EMAIL,
    icon: Mail,
  },
  {
    title: 'Docs',
    body: 'Inspect the current surface, contract, and product truth before reaching out.',
    href: DOCS_URL,
    label: 'docs.mutx.dev',
    icon: BookOpen,
  },
  {
    title: 'GitHub',
    body: 'Review the live repo, issues, and shipping state directly.',
    href: GITHUB_URL,
    label: 'fortunexbt/mutx-dev',
    icon: Github,
  },
]

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-20 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 max-w-4xl">
          <div className="eyebrow mb-5">Contact</div>
          <h1 className="text-4xl font-medium tracking-tight sm:text-6xl">Contact MUTX.</h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-white/60 sm:text-lg">
            This page is for institutional inbound: funding, partnerships, contributions, ideas, demos, hosted access,
            and other serious conversations around MUTX. Keep it concise, pick the right inquiry type, and we will route it correctly.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {inquiryTracks.map((track) => (
            <div key={track.title} className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-5">
              <p className="text-sm font-medium text-white">{track.title}</p>
              <p className="mt-3 text-sm leading-6 text-white/60">{track.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <ContactLeadForm />

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-6">
              <h2 className="text-xl font-medium text-white">What to include</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-white/60">
                <li>• who you are and what organization you represent</li>
                <li>• the exact funding, partnership, contribution, or product angle</li>
                <li>• what you need to see from MUTX in the near term</li>
                <li>• timing, deployment constraints, and decision context if relevant</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-6">
              <h2 className="text-xl font-medium text-white">Direct channels</h2>
              <div className="mt-4 space-y-4">
                {directChannels.map((item) => (
                  <a
                    key={item.title}
                    href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
                    className="block rounded-xl border border-white/10 bg-black/40 p-4 transition-colors hover:border-white/20 hover:bg-black/60"
                  >
                    <div className="flex items-center gap-3 text-white">
                      <item.icon className="h-4 w-4 text-white/80" />
                      <span className="font-medium">{item.title}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/60">{item.body}</p>
                    <div className="mt-3 inline-flex items-center gap-2 text-sm text-white/80">
                      <span>{item.label}</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </a>
                ))}
              </div>
            </div>

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
