import Image from "next/image";
import Link from "next/link";
import { IBM_Plex_Mono, IBM_Plex_Sans, Syne } from "next/font/google";
import { ArrowRight, BookOpen, TerminalSquare } from "lucide-react";

import { CalendlyPopupButton } from "@/components/landing/CalendlyPopupButton";
import { HeroMonitorShowcase } from "@/components/landing/HeroMonitorShowcase";
import { MotionIn } from "@/components/landing/MotionPrimitives";
import { QuickstartTabs } from "@/components/landing/QuickstartTabs";

export const dynamic = "force-dynamic";

const displayFont = Syne({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-landing-display",
});

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-landing-body",
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-landing-mono",
});

const GITHUB_URL = "https://github.com/mutx-dev/mutx-dev";
const DOCS_URL = "https://docs.mutx.dev";

const navLinks = [
  { label: "Why now", href: "#why-mutx" },
  { label: "Quickstart", href: "#quickstart" },
] as const;

const heroSignals = [
  { label: "Broken deploys", value: "Kill momentum" },
  { label: "Security stalls", value: "Delay approval" },
  { label: "Cost drift", value: "Blows budget" },
  { label: "Fire drills", value: "Kill scale" },
] as const;

const fearCards = [
  {
    title: "Broken client deployments",
    body: "The demo worked. Production did not.",
  },
  {
    title: "Blocked security review",
    body: "No one can explain isolation, access, and audit fast enough.",
  },
  {
    title: "Opaque model spend",
    body: "Budget disappears when costs stop being legible.",
  },
  {
    title: "Bespoke operator work",
    body: "If every rollout is custom, there is no repeatable motion.",
  },
] as const;

const buyerOutcomes = ["Control", "Speed", "Predictability"] as const;

const enemyList = [
  "Fragile demo-to-production transitions",
  "Shared-tenant wrappers",
  "Opaque model spend",
  "Teams stuck firefighting bespoke deployments",
] as const;

const startingWedge = [
  "AI agencies shipping client work",
  "Small product teams shipping automations",
  "Internal AI platform teams next",
] as const;

const footerProblems = [
  "Broken deployments",
  "Blocked security review",
  "Cost visibility",
] as const;

const footerCallShape = [
  "1 shared use case",
  "1 owner",
  "1 success metric",
  "4 to 6 week pilot",
  "Clean unwind if it does not work",
] as const;

const footerLinks = [
  { label: "Docs", href: DOCS_URL },
  { label: "GitHub", href: GITHUB_URL },
] as const;

type SectionHeadingProps = {
  label: string;
  title: string;
  body?: string;
};

function SectionHeading({ label, title, body }: SectionHeadingProps) {
  return (
    <div className="max-w-4xl">
      <div className="landing-kicker">{label}</div>
      <h2 className="mt-5 font-[family:var(--font-landing-display)] text-4xl font-semibold tracking-[-0.08em] text-white sm:text-5xl">
        {title}
      </h2>
      {body ? (
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300/80">
          {body}
        </p>
      ) : null}
    </div>
  );
}

function LandingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[color:var(--landing-line)] bg-[#06101a]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-[1.15rem] border border-cyan-300/15 bg-[linear-gradient(180deg,rgba(230,238,246,0.24)_0%,rgba(95,114,131,0.18)_100%)] p-1.5 shadow-[0_16px_38px_rgba(34,211,238,0.18)] ring-1 ring-inset ring-white/8 transition group-hover:border-cyan-300/30">
            <div className="absolute inset-[1px] rounded-[1rem] bg-[radial-gradient(circle_at_50%_20%,rgba(103,232,249,0.16),transparent_56%),linear-gradient(180deg,rgba(15,23,42,0.94)_0%,rgba(4,10,18,0.96)_100%)]" />
            <Image
              src="/logo.png"
              alt="MUTX logo"
              fill
              sizes="3rem"
              className="relative z-10 object-contain p-1 brightness-[1.12] contrast-[1.06]"
            />
          </div>
          <div>
            <p className="font-[family:var(--font-landing-mono)] text-[0.7rem] uppercase tracking-[0.34em] text-slate-200">
              MUTX
            </p>
            <p className="text-sm font-medium text-slate-300/85">
              Operator control plane
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Landing">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-slate-400 transition hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/15 hover:bg-white/[0.05] md:inline-flex"
          >
            Docs
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/15 hover:bg-white/[0.05] xl:inline-flex"
          >
            GitHub
          </a>
          <a
            href="#quickstart"
            className="hidden rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/15 hover:bg-white/[0.05] lg:inline-flex"
          >
            Quickstart
          </a>
          <CalendlyPopupButton className="landing-button-primary px-5 py-3 text-sm">
            Book a demo
          </CalendlyPopupButton>
        </div>
      </div>
    </header>
  );
}

export default function LandingPage() {
  return (
    <div
      className={`landing-page ${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} min-h-screen bg-[#03070d] text-white [font-family:var(--font-landing-body)]`}
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(44,133,160,0.3),transparent_22%),radial-gradient(circle_at_100%_8%,rgba(26,97,120,0.22),transparent_24%),linear-gradient(180deg,#07121d_0%,#02070f_54%,#02050a_100%)]" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(124,150,171,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(124,150,171,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute left-[-12%] top-[12%] h-[32rem] w-[32rem] rounded-full bg-cyan-500/10 blur-[140px]" />
        <div className="absolute right-[-10%] top-[16%] h-[26rem] w-[26rem] rounded-full bg-sky-400/8 blur-[130px]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(4,10,18,0.4),transparent)]" />
      </div>

      <LandingNav />

      <main className="relative z-10">
        <section className="px-4 pb-20 pt-32 sm:px-6 sm:pt-36 lg:px-8 lg:pb-24 lg:pt-40">
          <div className="mx-auto max-w-7xl">
            <div className="landing-panel-strong relative overflow-hidden px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(103,232,249,0.09),transparent_26%),radial-gradient(circle_at_100%_22%,rgba(56,189,248,0.08),transparent_24%)]"
              />

              <div className="relative grid gap-10 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] xl:items-center">
                <div className="max-w-2xl">
                  <div className="landing-kicker">
                    Assistant-first operator control plane
                  </div>

                  <h1 className="mt-6 font-[family:var(--font-landing-display)] text-5xl font-semibold leading-[0.92] tracking-[-0.09em] text-white sm:text-6xl xl:text-[5.15rem]">
                    Operate deployed agents
                    <span className="block text-cyan-300">
                      like infrastructure.
                    </span>
                  </h1>

                  <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-[1.18rem] sm:leading-9">
                    If the demo works but rollout, review, or cost control breaks
                    in production, the deal stalls. MUTX gives operators control
                    before that happens.
                  </p>

                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Link
                      href="/app"
                      prefetch={false}
                      className="landing-button-primary px-7 py-4 text-base"
                    >
                      Open live demo
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <a
                      href="#quickstart"
                      className="landing-button-secondary px-7 py-4 text-base"
                    >
                      Run quickstart
                      <TerminalSquare className="h-4 w-4" />
                    </a>
                    <a
                      href={DOCS_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="landing-button-secondary px-7 py-4 text-base"
                    >
                      Read docs
                      <BookOpen className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                <HeroMonitorShowcase className="xl:-mr-8" />
              </div>

              <div className="relative mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {heroSignals.map((item, index) => (
                  <MotionIn key={item.label} delay={0.05 * index}>
                    <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.03] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-300">
                        {item.value}
                      </p>
                      <p className="mt-2 font-[family:var(--font-landing-mono)] text-[0.66rem] uppercase tracking-[0.28em] text-slate-500">
                        {item.label}
                      </p>
                    </div>
                  </MotionIn>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="why-mutx" className="px-4 py-24 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <MotionIn>
              <SectionHeading
                label="Why now"
                title="The sale dies at production handoff."
                body="Buyers do not wake up wanting agent infrastructure. They wake up wanting deployments that stop breaking, reviews that stop blocking, and costs that stop surprising them."
              />
            </MotionIn>

            <div className="mt-12 grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
              <MotionIn>
                <article className="landing-panel-strong relative overflow-hidden p-6 lg:p-8">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(248,113,113,0.16),transparent_22%),radial-gradient(circle_at_100%_0%,rgba(103,232,249,0.1),transparent_28%)]"
                  />
                  <div className="relative">
                    <p className="landing-kicker border-red-300/20 bg-red-400/10 text-red-100">
                      What kills the deal
                    </p>
                    <h3 className="mt-4 font-[family:var(--font-landing-display)] text-3xl font-semibold tracking-[-0.07em] text-white sm:text-[2.35rem]">
                      The risk is not the model. It is everything around it.
                    </h3>
                    <div className="mt-8 grid gap-4 md:grid-cols-2">
                      {fearCards.map((item) => (
                        <div
                          key={item.title}
                          className="rounded-[1.7rem] border border-white/10 bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                        >
                          <h4 className="text-lg font-semibold tracking-[-0.04em] text-white">
                            {item.title}
                          </h4>
                          <p className="mt-3 text-sm leading-7 text-slate-300/80">
                            {item.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              </MotionIn>

              <div className="grid gap-5">
                <MotionIn delay={0.05}>
                  <article className="landing-panel p-6">
                    <p className="landing-kicker">What buyers purchase</p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      {buyerOutcomes.map((item) => (
                        <div
                          key={item}
                          className="rounded-[1.4rem] border border-cyan-300/16 bg-cyan-300/[0.08] px-4 py-5 text-center"
                        >
                          <p className="font-[family:var(--font-landing-mono)] text-[0.72rem] uppercase tracking-[0.24em] text-cyan-100">
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-5 text-sm leading-7 text-slate-300/80">
                      Lead with the business outcome, not the architecture.
                    </p>
                  </article>
                </MotionIn>

                <MotionIn delay={0.1}>
                  <article className="landing-panel p-6">
                    <p className="landing-kicker">Start here</p>
                    <h3 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-white">
                      Deployment-sensitive teams.
                    </h3>
                    <div className="mt-5 grid gap-3">
                      {startingWedge.map((item) => (
                        <div
                          key={item}
                          className="rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-slate-200"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {enemyList.map((item) => (
                        <span key={item} className="landing-chip">
                          {item}
                        </span>
                      ))}
                    </div>
                  </article>
                </MotionIn>
              </div>
            </div>
          </div>
        </section>

        <section id="quickstart" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <MotionIn>
              <SectionHeading
                label="Proof path"
                title="Run the proof path."
                body="Use the smallest lane that gets you to a real runtime."
              />
            </MotionIn>

            <MotionIn className="mt-10" delay={0.06}>
              <QuickstartTabs />
            </MotionIn>
          </div>
        </section>

        <section className="px-4 pb-24 pt-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <MotionIn>
              <div className="landing-panel-strong relative overflow-hidden p-6 lg:p-8">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(103,232,249,0.14),transparent_22%),radial-gradient(circle_at_100%_0%,rgba(248,113,113,0.12),transparent_18%)]"
                />

                <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(19rem,0.98fr)] lg:items-start">
                  <div>
                    <div className="landing-kicker">Book a demo</div>
                    <h2 className="mt-5 font-[family:var(--font-landing-display)] text-4xl font-semibold tracking-[-0.08em] text-white sm:text-5xl">
                      Bring the workflow that keeps breaking.
                    </h2>
                    <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300/82">
                      If deployments stall, security blocks, or cost visibility
                      disappears, we will work from the exact path that is
                      already slowing the deal down.
                    </p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      {footerProblems.map((item) => (
                        <div
                          key={item}
                          className="rounded-[1.4rem] border border-white/10 bg-black/20 px-4 py-4 text-sm font-medium text-slate-100"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-white/10 bg-[#06111d]/90 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                    <div>
                      <p className="font-[family:var(--font-landing-mono)] text-[0.68rem] uppercase tracking-[0.22em] text-slate-500">
                        Discovery call
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-white">
                        20-minute working session
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-300/78">
                        Bring the rollout, review, or cost problem that is already
                        dragging the sale down.
                      </p>
                    </div>

                    <div className="mt-6 grid gap-3">
                      {footerCallShape.map((item) => (
                        <div
                          key={item}
                          className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm font-medium text-slate-200"
                        >
                          {item}
                        </div>
                      ))}
                    </div>

                    <CalendlyPopupButton className="landing-button-primary mt-6 w-full justify-between px-5 py-4 text-base">
                      Book a demo
                      <ArrowRight className="h-5 w-5" />
                    </CalendlyPopupButton>
                  </div>
                </div>

                <footer className="relative mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-[1rem] border border-cyan-300/15 bg-[linear-gradient(180deg,rgba(230,238,246,0.24)_0%,rgba(95,114,131,0.18)_100%)] p-1 shadow-[0_12px_28px_rgba(34,211,238,0.12)] ring-1 ring-inset ring-white/8">
                      <div className="absolute inset-[1px] rounded-[0.9rem] bg-[radial-gradient(circle_at_50%_20%,rgba(103,232,249,0.14),transparent_56%),linear-gradient(180deg,rgba(15,23,42,0.94)_0%,rgba(4,10,18,0.96)_100%)]" />
                      <Image
                        src="/logo.png"
                        alt="MUTX logo"
                        fill
                        sizes="2.5rem"
                        className="relative z-10 object-contain p-1 brightness-[1.08] contrast-[1.04]"
                      />
                    </div>
                    <div>
                      <p className="font-[family:var(--font-landing-mono)] text-[0.68rem] uppercase tracking-[0.28em] text-slate-300">
                        MUTX
                      </p>
                      <p className="text-sm text-slate-400">
                        Control, speed, predictable economics.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                    {footerLinks.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="transition hover:text-white"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                </footer>
              </div>
            </MotionIn>
          </div>
        </section>
      </main>
    </div>
  );
}
