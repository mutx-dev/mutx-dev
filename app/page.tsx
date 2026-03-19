import Image from 'next/image'
import { ArrowRight, BookOpen, CloudCog, ExternalLink, Github, TerminalSquare } from 'lucide-react'

import { ComingSoonButton } from '@/components/landing/ComingSoonButton'
import { LandingHero } from '@/components/landing/LandingHero'
import { QuickstartTabs } from '@/components/landing/QuickstartTabs'

const GITHUB_URL = 'https://github.com/mutx-dev/mutx-dev'
const DOCS_URL = 'https://docs.mutx.dev'

const navLinks = [
  { label: 'Quickstart', href: '#quickstart' },
  { label: 'What ships', href: '#ships' },
  { label: 'Surface', href: '#surface' },
  { label: 'FAQ', href: '#faq' },
]

const shippedSurfaces = [
  ['mutx.dev', 'Public product narrative and entry point', 'Live today'],
  ['docs.mutx.dev', 'Canonical docs and API reference', 'Live today'],
  ['FastAPI control plane', 'Auth, agents, deployments, API keys, webhooks, ingest, health', 'Supported in repo'],
  ['Python CLI', 'Auth, status, agents, deployments, webhooks, API keys, config', 'Supported in repo'],
  ['mutx tui', 'Operator-focused Textual shell for agents and deployments', 'Supported in repo'],
  ['app.mutx.dev', 'Operator-facing web app shell', 'Dashboard coming soon'],
] as const

const operatorCards = [
  {
    title: 'Control plane',
    body: 'Auth, agents, deployments, health, webhooks, ingest, and the versioned /v1/* contract.',
    icon: CloudCog,
  },
  {
    title: 'CLI + TUI',
    body: 'mutx and mutx tui share the same auth state and let operators act before the web dashboard catches up.',
    icon: TerminalSquare,
  },
  {
    title: 'Docs + contracts',
    body: 'The docs, API shape, and repo map describe the same system instead of three conflicting product stories.',
    icon: BookOpen,
  },
]

const repoMap = ['app/', 'src/api/', 'cli/', 'sdk/', 'infrastructure/', 'docs/']

const tuiSupport = [
  'auth and session state visibility',
  'agent list and detail views',
  'agent deploy and log inspection',
  'deployment list, events, logs, and metrics',
  'safe actions with confirmation: restart, scale, delete',
  'refreshable panes and keyboard-first navigation',
]

const keyBindings = ['r refresh pane', 'd deploy selected agent', 'x restart deployment', 's scale deployment', 'backspace delete deployment', 'q quit']

const faqItems = [
  {
    q: 'Is MUTX just another dashboard?',
    a: 'No. The serious path today is the control plane, CLI, TUI, docs, and repo. The hosted dashboard is catching up, not carrying the whole product.',
  },
  {
    q: 'What is real today?',
    a: 'FastAPI control plane, versioned /v1/* API, docs, Python CLI, and the Textual TUI are all supported in repo right now.',
  },
  {
    q: 'Do I need to replace my runtime?',
    a: 'No. MUTX is for operating real runtimes better, not forcing a fake greenfield worldview.',
  },
  {
    q: 'Why keep CLI, TUI, docs, and app together?',
    a: 'Because operators should not have to learn a different product every time they switch surfaces.',
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
          <ComingSoonButton label="Web dashboard" />
        </nav>

        <ComingSoonButton className="md:hidden" label="Dashboard" />
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
            <LandingHero docsHref={DOCS_URL} repoHref={GITHUB_URL} />
          </div>
        </section>

        <section id="quickstart" className="site-section pt-3">
          <div className="site-shell">
            <div className="mb-6 max-w-4xl">
              <p className="site-kicker">Quickstart</p>
              <h2 className="site-title mt-3">
                Fastest path into the operator loop.
                <span className="block text-white/74">Install it. Configure it. Authenticate. Open the TUI when you are ready.</span>
              </h2>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)]">
              <QuickstartTabs />

              <div className="grid gap-4">
                <div className="site-panel-strong p-5 sm:p-6">
                  <p className="site-kicker">What the setup touches</p>
                  <div className="mt-4 grid gap-3">
                    {[
                      ['/opt/homebrew/bin/mutx', 'the Homebrew-linked MUTX CLI entrypoint'],
                      ['~/.mutx/config.json', 'shared auth and API state for the CLI and TUI'],
                      ['mutx status', 'the local smoke check the installer runs after install'],
                      ['mutx tui', 'the operator shell the wizard offers to open at the end'],
                    ].map(([title, body]) => (
                      <div key={title} className="site-step-card">
                        <div className="text-sm font-semibold text-white">{title}</div>
                        <div className="mt-1 text-sm leading-6 text-white/62">{body}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="site-panel p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="site-kicker">Today vs next</p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">Trust the supported lane.</h3>
                    </div>
                    <span className="site-status-live">shipping today</span>
                  </div>

                  <div className="mt-4 space-y-3 text-sm leading-6 text-white/66">
                    <p>Today: control plane, CLI, TUI, docs, versioned API, repo validation.</p>
                    <p>Next: the hosted web dashboard grows into the same operator truth instead of becoming a separate fantasy product.</p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <a href={DOCS_URL} target="_blank" rel="noreferrer" className="site-button-secondary">
                      Deployment quickstart
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <ComingSoonButton label="Open dashboard" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="ships" className="site-section site-defer pt-2">
          <div className="site-shell">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.06fr)_minmax(20rem,0.94fr)]">
              <div className="site-panel-strong p-6 sm:p-7">
                <p className="site-kicker">What ships today</p>
                <h2 className="mt-3 text-4xl font-semibold leading-tight tracking-[-0.05em] text-white">
                  Real surfaces.
                  <span className="block text-cyan-200">Clear support boundaries.</span>
                </h2>

                <div className="mt-6 overflow-x-auto">
                  <table className="site-table min-w-full">
                    <thead>
                      <tr>
                        <th>Surface</th>
                        <th>Truth today</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shippedSurfaces.map(([surface, truth, status]) => (
                        <tr key={surface}>
                          <td className="font-semibold text-white">{surface}</td>
                          <td>{truth}</td>
                          <td>
                            <span className={status === 'Dashboard coming soon' ? 'site-status-soon' : 'site-status-live'}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="site-panel-strong overflow-hidden">
                  <div className="grid gap-0 md:grid-cols-[0.92fr_1.08fr]">
                    <div className="relative min-h-[18rem]">
                      <Image
                        src="/landing/webp/reading-bench.webp"
                        alt="MUTX robot reading documentation"
                        fill
                        sizes="(max-width: 1279px) 100vw, 20rem"
                        className="object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#07121c] via-transparent to-transparent" />
                    </div>
                    <div className="p-5 sm:p-6">
                      <p className="site-kicker">Docs are first-class</p>
                      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">The docs are part of the product.</h3>
                      <p className="mt-3 text-sm leading-6 text-white/66">
                        Architecture, CLI reference, deployment quickstart, and route truth all exist to reduce operator confusion, not to decorate the repo.
                      </p>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <a href={DOCS_URL} target="_blank" rel="noreferrer" className="site-button-primary">
                          Open docs
                          <BookOpen className="h-4 w-4" />
                        </a>
                        <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="site-button-secondary">
                          View repo
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {operatorCards.map((card) => (
                    <article key={card.title} className="site-panel p-5">
                      <card.icon className="h-5 w-5 text-cyan-200" />
                      <h3 className="mt-4 text-xl font-semibold tracking-tight text-white">{card.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-white/64">{card.body}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="surface" className="site-section site-defer pt-2">
          <div className="site-shell">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.02fr)_minmax(18rem,0.98fr)]">
              <div className="site-panel-strong p-6 sm:p-7">
                <p className="site-kicker">Operator surface</p>
                <h2 className="mt-3 text-4xl font-semibold leading-tight tracking-[-0.05em] text-white">
                  The first real interface is not the hosted dashboard.
                  <span className="block text-white/74">It is the CLI and the TUI.</span>
                </h2>

                <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(18rem,1.08fr)]">
                  <div className="site-code-shell">
                    <div className="site-code-header">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.22em] text-white/46">mutx tui</div>
                        <div className="mt-1 text-base font-semibold text-white">Operator shell</div>
                      </div>
                      <span className="site-status-live">supported in repo</span>
                    </div>
                    <div className="site-code-block">
                      <code>{`mutx status
mutx login --email you@example.com
mutx whoami
mutx agents list --limit 10
mutx deploy list --limit 10
mutx tui`}</code>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {tuiSupport.map((item, index) => (
                      <div key={item} className="site-step-card">
                        <div className="site-step-index">{`Support 0${index + 1}`}</div>
                        <p className="mt-3 text-sm leading-6 text-white/66">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="site-panel-strong p-5 sm:p-6">
                  <p className="site-kicker">TUI keys</p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">Keyboard-first on purpose.</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {keyBindings.map((item) => (
                      <div key={item} className="site-step-card">
                        <p className="text-sm font-semibold text-white">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="site-panel-strong overflow-hidden">
                  <div className="grid gap-0 md:grid-cols-[1.05fr_0.95fr]">
                    <div className="p-5 sm:p-6">
                      <p className="site-kicker">Repo map</p>
                      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">One repo, six lanes.</h3>
                      <p className="mt-3 text-sm leading-6 text-white/66">
                        Next.js surfaces, FastAPI control plane, operator tooling, SDK, infrastructure, and docs all ship in one place.
                      </p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {repoMap.map((item) => (
                          <span key={item} className="site-chip">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="relative min-h-[18rem]">
                      <Image
                        src="/landing/webp/victory-core.webp"
                        alt="MUTX robot holding the MUTX mark aloft"
                        fill
                        sizes="(max-width: 1279px) 100vw, 20rem"
                        className="object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#07121c] via-[#07121c]/20 to-transparent" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="site-section site-defer pt-2">
          <div className="site-shell">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
              <div className="grid gap-4 md:grid-cols-2">
                {faqItems.map((item) => (
                  <article key={item.q} className="site-panel p-5 sm:p-6">
                    <h3 className="text-xl font-semibold tracking-tight text-white">{item.q}</h3>
                    <p className="mt-3 text-base leading-7 text-white/66">{item.a}</p>
                  </article>
                ))}
              </div>

              <div className="site-panel-strong p-6 sm:p-7">
                <p className="site-kicker">Start here</p>
                <h2 className="mt-3 text-4xl font-semibold leading-tight tracking-[-0.05em] text-white">
                  Build the weird agent thing.
                  <span className="block text-cyan-200">Just give it infrastructure first.</span>
                </h2>
                <p className="mt-4 text-base leading-7 text-white/68">
                  MUTX is strongest when it is honest about where the real product is today: local stack, CLI, TUI, docs, contracts, and operator posture.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href="#quickstart" className="site-button-primary">
                    Run quickstart
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a href={DOCS_URL} target="_blank" rel="noreferrer" className="site-button-secondary">
                    Open docs
                  </a>
                  <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="site-button-secondary">
                    <Github className="h-4 w-4" />
                    View GitHub
                  </a>
                  <ComingSoonButton label="Web dashboard" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
