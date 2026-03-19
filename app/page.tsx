import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BookOpen, Command, FileText, Github, Radar, ShieldCheck, Webhook } from 'lucide-react'

import { CompactDemoSurface } from '@/components/landing/CompactDemoSurface'
import { LandingHero } from '@/components/landing/LandingHero'

const GITHUB_URL = 'https://github.com/fortunexbt/mutx-dev'
const DOCS_URL = 'https://docs.mutx.dev'
const APP_URL = 'https://app.mutx.dev/login'

const navLinks = [
  { label: 'Manifesto', href: '#manifesto' },
  { label: 'Surface', href: '#surface' },
  { label: 'Docs', href: '#docs' },
  { label: 'FAQ', href: '#faq' },
]

const operatorCards = [
  {
    title: 'Deploy with receipts',
    body: 'Every rollout should leave behind versions, ownership, posture, and evidence instead of crossed fingers.',
    icon: Radar,
  },
  {
    title: 'Govern without ceremony',
    body: 'Keys, auth, approvals, and routes belong in the same product surface as deploy and recovery.',
    icon: ShieldCheck,
  },
  {
    title: 'Recover faster than panic',
    body: 'Runs, traces, health, and replay only matter if operators can intervene without switching mental models.',
    icon: Webhook,
  },
]

const faqItems = [
  {
    q: 'Is this another dashboard?',
    a: 'No. MUTX is for the moment your agent starts touching real systems and needs deploy, ownership, recovery, and receipts.',
  },
  {
    q: 'Why the fake demos?',
    a: 'Because product posture is easier to feel than explain. The demos show the control loop without pretending to be the actual app.',
  },
  {
    q: 'Do I need a full greenfield stack?',
    a: 'No. MUTX is designed to sit on top of real runtimes, not replace them with a religion.',
  },
  {
    q: 'Why does the docs lane matter so much?',
    a: 'Because production credibility collapses the second the app and docs tell different stories.',
  },
]

function SiteNav() {
  return (
    <header className="site-topbar">
      <div className="site-shell flex items-center justify-between py-4">
        <a href="#" className="site-brand">
          <div className="site-brand-mark">
            <Image src="/logo.png" alt="MUTX" fill className="object-contain p-1.5" />
          </div>
          <div>
            <p className="site-brand-overline">MUTX</p>
            <p className="site-brand-title">control plane for agents with a pulse</p>
          </div>
        </a>

        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href} className="site-nav-link">
              {link.label}
            </a>
          ))}
          <a href={DOCS_URL} target="_blank" rel="noreferrer" className="site-nav-link">
            docs.mutx.dev
          </a>
          <a href={APP_URL} className="site-button-accent">
            Enter the control plane
            <ArrowRight className="h-4 w-4" />
          </a>
        </nav>

        <a href={APP_URL} className="site-button-accent md:hidden">
          Open app
        </a>
      </div>
    </header>
  )
}

export default function LandingPage() {
  return (
    <div className="site-page">
      <SiteNav />

      <main className="relative overflow-hidden pt-28">
        <section className="site-section pt-4 lg:pt-6">
          <div className="site-shell">
            <LandingHero
              appHref={APP_URL}
              docsHref={DOCS_URL}
              repoHref={GITHUB_URL}
              eyebrow="No AI slop. No dead-end demo theater."
              title="Agents are a blast."
              accent="Production is the boss fight."
              kicker="MUTX is the loadout."
              description="MUTX is the open-source control plane for the moment your agent stops being a cute demo and starts touching real systems. Deploy it. Route it. Govern it. Trace it. Recover it."
            />
          </div>
        </section>

        <section id="manifesto" className="site-section site-defer pt-3">
          <div className="site-shell">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
              <div className="grid gap-4 md:grid-cols-3">
                {operatorCards.map((item) => (
                  <article key={item.title} className="site-panel p-5">
                    <item.icon className="h-5 w-5 text-cyan-200" />
                    <h2 className="mt-4 text-[1.95rem] font-semibold leading-tight tracking-[-0.05em] text-white">{item.title}</h2>
                    <p className="mt-3 text-base leading-7 text-white/66">{item.body}</p>
                  </article>
                ))}
              </div>

              <aside className="site-panel-strong flex flex-col justify-between p-6">
                <div>
                  <p className="site-kicker">Manifesto for agent infrastructure</p>
                  <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.05em] text-white">
                    The operator gets their hands back on the wheel.
                  </h2>
                  <p className="mt-4 text-base leading-7 text-white/68">
                    MUTX is not trying to make infrastructure cute. It is trying to make it governable, legible, and fast when the weird agent thing starts behaving like software with consequences.
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {['auth', 'records', 'routes', 'deployments', 'health', 'replay'].map((chip) => (
                    <span key={chip} className="site-chip">
                      {chip}
                    </span>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section id="surface" className="site-section site-defer pt-3">
          <div className="site-shell">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.04fr)_minmax(20rem,0.96fr)]">
              <CompactDemoSurface
                eyebrow="Fake demo. Real posture."
                title="One operator loop. Not a graveyard of disconnected tabs."
                description="A compact MUTX fantasy built for marketing, but with the same job to be done as the real product: make deploy, trace, replay, and governance feel like one lane."
                assetSrc="/landing/webp/wiring-bay.webp"
                assetAlt="MUTX robot maintaining a live runtime bay"
                metrics={[
                  { label: 'deploys', value: '142', delta: '+8 today' },
                  { label: 'trace p95', value: '184ms', delta: 'under control' },
                  { label: 'replays', value: '9', delta: '2 queued' },
                ]}
                cliLines={[
                  { command: 'mutx deploy restart checkout-bot', result: 'restart queued · ownership scope applied' },
                  { command: 'mutx traces inspect run_4021', result: 'latency spike isolated at tool step 07' },
                  { command: 'mutx webhooks replay whd_91', result: 'accepted · audit trail written' },
                ]}
                tuiRows={[
                  { label: 'api auth boundary', status: 'steady', tone: 'good' },
                  { label: 'checkout deploy prod', status: 'warming', tone: 'warn' },
                  { label: 'webhook replay lane', status: 'ready', tone: 'good' },
                  { label: 'memory index drift', status: 'watch', tone: 'bad' },
                ]}
              />

              <div className="grid gap-4">
                <div className="site-panel-strong p-6">
                  <p className="site-kicker">Why this hits</p>
                  <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.05em] text-white">
                    Serious infrastructure.
                    <span className="block text-cyan-200">Way more fun than it has any right to be.</span>
                  </h2>
                  <p className="mt-4 text-base leading-7 text-white/68">
                    The best operator tools make pressure feel manageable: fast UI, clear posture, honest state, and no corporate wallpaper pretending to be a product.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="site-panel p-5">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/46">App + API + CLI</p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-white">One model everywhere.</p>
                    <p className="mt-3 text-sm leading-6 text-white/64">
                      The resource model should not shape-shift depending on which surface the operator touches.
                    </p>
                  </div>

                  <div className="site-panel p-5">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/46">Docs with posture</p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-white">Receipts over vibes.</p>
                    <p className="mt-3 text-sm leading-6 text-white/64">
                      Docs should explain how the system behaves under pressure, not just hand you cheerful snippets.
                    </p>
                  </div>
                </div>

                <div className="site-panel overflow-hidden p-0">
                  <div className="grid gap-0 md:grid-cols-[0.92fr_1.08fr]">
                    <div className="relative min-h-[15rem]">
                      <Image
                        src="/landing/webp/reading-bench.webp"
                        alt="MUTX robot reading documentation"
                        fill
                        sizes="(max-width: 1279px) 100vw, 22rem"
                        className="object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#07121c] via-[#07121c]/35 to-transparent" />
                    </div>

                    <div className="p-5 sm:p-6">
                      <p className="site-kicker">Docs lane</p>
                      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">The docs are part of the product.</h2>
                      <ul className="mt-4 space-y-3 text-sm leading-6 text-white/66">
                        <li>Architecture and API shape should make sense at 2 a.m.</li>
                        <li>The app, API, CLI, and docs should tell the same story.</li>
                        <li>Confused operators need answers fast, not another marketing page.</li>
                      </ul>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <a href={DOCS_URL} target="_blank" rel="noreferrer" className="site-button-primary">
                          Open docs
                          <BookOpen className="h-4 w-4" />
                        </a>
                        <Link href="/contact" className="site-button-secondary">
                          Talk to the team
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="docs" className="site-section site-defer pt-3">
          <div className="site-shell">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
              <div className="site-panel-strong overflow-hidden">
                <div className="grid gap-0 md:grid-cols-[0.92fr_1.08fr]">
                  <div className="relative min-h-[22rem]">
                    <Image
                      src="/landing/webp/thumbs-up-portrait.webp"
                      alt="MUTX robot giving a thumbs up"
                      fill
                      sizes="(max-width: 1279px) 100vw, 24rem"
                      className="object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07121c] via-transparent to-transparent" />
                  </div>

                  <div className="p-6 sm:p-8">
                    <p className="site-kicker">Final call</p>
                    <h2 className="mt-3 text-4xl font-semibold leading-tight tracking-[-0.05em] text-white">
                      Build the weird agent thing.
                      <span className="block text-cyan-200">Just give it infrastructure before it bites you.</span>
                    </h2>
                    <p className="mt-4 text-base leading-7 text-white/68">
                      MUTX exists for the second your agent stops being adorable and starts needing deploys, routes, traces, keys, docs, and an operator who can actually intervene.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <a href={APP_URL} className="site-button-primary">
                        Enter the control plane
                        <ArrowRight className="h-4 w-4" />
                      </a>
                      <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="site-button-secondary">
                        <Github className="h-4 w-4" />
                        View source
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div id="faq" className="grid gap-4">
                <div className="site-panel-strong p-6">
                  <p className="site-kicker">FAQ</p>
                  <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.05em] text-white">
                    Straight answers.
                    <span className="block text-white/74">No corporate wallpaper.</span>
                  </h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {faqItems.map((item) => (
                    <article key={item.q} className="site-panel p-5">
                      <h3 className="text-xl font-semibold tracking-tight text-white">{item.q}</h3>
                      <p className="mt-3 text-base leading-7 text-white/66">{item.a}</p>
                    </article>
                  ))}
                </div>

                <div className="site-panel p-5">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/46">Shipping surfaces</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {[
                      { label: 'Dashboard', icon: Radar },
                      { label: 'CLI', icon: Command },
                      { label: 'Docs', icon: FileText },
                    ].map((item) => (
                      <div key={item.label} className="rounded-[1rem] border border-white/10 bg-white/[0.03] px-4 py-3">
                        <item.icon className="h-4 w-4 text-cyan-200" />
                        <p className="mt-2 text-sm font-semibold text-white">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
