import Image from "next/image";
import Link from "next/link";
import { IBM_Plex_Mono, IBM_Plex_Sans, Syne } from "next/font/google";
import {
  ArrowRight,
  BookOpen,
  Github,
  Radar,
  ShieldCheck,
  TerminalSquare,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ControlLoopTabs } from "@/components/landing/ControlLoopTabs";
import { HeroMonitorShowcase } from "@/components/landing/HeroMonitorShowcase";
import { MotionIn } from "@/components/landing/MotionPrimitives";
import { OpenClawFlowShowcase } from "@/components/landing/OpenClawFlowShowcase";
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
  { label: "Why MUTX", href: "#why-mutx" },
  { label: "Quickstart", href: "#quickstart" },
  { label: "OpenClaw Flow", href: "#openclaw-flow" },
  { label: "Control Loop", href: "#control-loop" },
] as const;

const heroSignals = [
  { label: "Deployments", value: "Live" },
  { label: "Sessions", value: "Tracked" },
  { label: "Access", value: "Scoped" },
  { label: "Audit", value: "Visible" },
] as const;

const capabilityPanels = [
  {
    eyebrow: "Deploy",
    title: "Runtime moves",
    items: ["Templates", "Rollouts", "Health"],
    icon: ShieldCheck,
  },
  {
    eyebrow: "Observe",
    title: "Live signals",
    items: ["Sessions", "Usage", "Incidents"],
    icon: Radar,
  },
  {
    eyebrow: "Govern",
    title: "Visible boundaries",
    items: ["Access", "Connectors", "Audit"],
    icon: Workflow,
  },
] as const;

const controlSurfaces = [
  "Web demo",
  "CLI",
  "TUI",
  "/v1 API",
] as const;

const runtimeState = [
  "Deployments",
  "Sessions",
  "Access",
  "Connectors",
  "Audit",
  "Usage",
] as const;

type SectionHeadingProps = {
  label: string;
  title: string;
  body?: string;
  align?: "left" | "center";
};

function SectionHeading({
  label,
  title,
  body,
  align = "left",
}: SectionHeadingProps) {
  const centered = align === "center";

  return (
    <div className={centered ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
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

type CapabilityTileProps = {
  eyebrow: string;
  title: string;
  items: readonly string[];
  icon: LucideIcon;
};

function CapabilityTile({
  eyebrow,
  title,
  items,
  icon: Icon,
}: CapabilityTileProps) {
  return (
    <div className="rounded-[1.7rem] border border-white/10 bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-[family:var(--font-landing-mono)] text-[0.66rem] uppercase tracking-[0.28em] text-slate-500">
            {eyebrow}
          </p>
          <h3 className="mt-3 text-xl font-semibold tracking-[-0.05em] text-white">
            {title}
          </h3>
        </div>
        <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/10 p-3 text-cyan-200">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="landing-chip">
            {item}
          </span>
        ))}
      </div>
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
            className="hidden rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/15 hover:bg-white/[0.05] lg:inline-flex"
          >
            GitHub
          </a>
          <a
            href="#quickstart"
            className="landing-button-primary px-5 py-3 text-sm"
          >
            Quickstart
          </a>
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
                    One control plane for deployed assistants across web, CLI,
                    and TUI, starting with a graceful OpenClaw lane that stays
                    local and surfaces cleanly everywhere else.
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
                label="Why MUTX"
                title="One control plane. Four operator surfaces."
              />
            </MotionIn>

            <div className="mt-12 grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)]">
              <MotionIn>
                <article className="landing-panel-strong relative overflow-hidden p-6 lg:p-8">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(103,232,249,0.1),transparent_28%)]"
                  />
                  <div className="relative">
                    <p className="landing-kicker">Operator map</p>
                    <h3 className="mt-4 font-[family:var(--font-landing-display)] text-3xl font-semibold tracking-[-0.07em] text-white sm:text-[2.35rem]">
                      One runtime. Multiple entry points.
                    </h3>
                    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
                      <div className="rounded-[1.9rem] border border-white/10 bg-black/20 p-5">
                        <div className="grid gap-3 sm:grid-cols-2">
                          {controlSurfaces.map((item) => (
                            <div
                              key={item}
                              className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-center font-[family:var(--font-landing-mono)] text-[0.72rem] uppercase tracking-[0.24em] text-slate-200"
                            >
                              {item}
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-center py-4">
                          <div className="h-10 w-px bg-gradient-to-b from-cyan-300/0 via-cyan-300/40 to-cyan-300/0" />
                        </div>

                        <div className="rounded-[1.6rem] border border-cyan-300/18 bg-cyan-300/[0.08] px-5 py-5 text-center shadow-[0_18px_60px_rgba(34,211,238,0.08)]">
                          <p className="font-[family:var(--font-landing-mono)] text-[0.66rem] uppercase tracking-[0.3em] text-cyan-200/80">
                            MUTX control plane
                          </p>
                          <p className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">
                            Shared operator state
                          </p>
                        </div>

                        <div className="flex justify-center py-4">
                          <div className="h-10 w-px bg-gradient-to-b from-cyan-300/0 via-cyan-300/40 to-cyan-300/0" />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          {runtimeState.map((item) => (
                            <div
                              key={item}
                              className="rounded-[1.15rem] border border-white/10 bg-black/20 px-4 py-3 text-center text-sm font-medium text-slate-200"
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-4">
                        {capabilityPanels.map((panel) => (
                          <CapabilityTile key={panel.eyebrow} {...panel} />
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              </MotionIn>
            </div>
          </div>
        </section>

        <section id="quickstart" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <MotionIn>
              <div className="max-w-4xl">
                <div className="landing-kicker">Quickstart</div>
                <h2 className="mt-5 font-[family:var(--font-landing-display)] text-4xl font-semibold tracking-[-0.08em] text-white sm:text-5xl">
                  Bring MUTX and OpenClaw up fast.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300/80">
                  Install MUTX once, then let the provider wizard detect or install
                  OpenClaw, bind a dedicated assistant, and track the runtime under
                  <span className="px-2 font-[family:var(--font-landing-mono)] text-[0.9em] text-cyan-200">
                    ~/.mutx/providers/openclaw
                  </span>
                  without moving the upstream home.
                </p>
              </div>
            </MotionIn>

            <MotionIn className="mt-10" delay={0.06}>
              <QuickstartTabs />
            </MotionIn>
          </div>
        </section>

        <section id="openclaw-flow" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <MotionIn>
              <SectionHeading
                label="OpenClaw Flow"
                title="Use upstream OpenClaw. Keep the MUTX shell."
                body="The runtime stays local and upstream. MUTX adds the operator wrapper: detection, resumable setup, tracked bindings, honest dashboard sync, and the same control language across CLI, TUI, and web."
              />
            </MotionIn>

            <MotionIn className="mt-12" delay={0.06}>
              <OpenClawFlowShowcase />
            </MotionIn>
          </div>
        </section>

        <section id="control-loop" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <MotionIn>
              <SectionHeading
                label="Control Loop"
                title="See it. Change it. Recover it."
              />
            </MotionIn>

            <MotionIn className="mt-12" delay={0.06}>
              <ControlLoopTabs />
            </MotionIn>
          </div>
        </section>

        <section className="px-4 pb-24 pt-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <MotionIn>
              <div className="landing-panel relative overflow-hidden p-6 lg:p-8">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(103,232,249,0.12),transparent_22%),linear-gradient(135deg,rgba(8,21,33,0.22),transparent_40%)]"
                />
                <div className="relative grid gap-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(19rem,1.12fr)] lg:items-start">
                  <div>
                    <h2 className="mt-5 font-[family:var(--font-landing-display)] text-4xl font-semibold tracking-[-0.08em] text-white sm:text-5xl">
                      Local lane.
                    </h2>

                    <pre className="mt-6 overflow-x-auto whitespace-pre-wrap break-words rounded-[1.9rem] border border-white/10 bg-[#04101a] px-5 py-5 font-[family:var(--font-landing-mono)] text-[13px] leading-7 text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                      {`make dev-up
mutx setup local
mutx doctor
mutx tui`}
                    </pre>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Link
                        href="/app"
                        prefetch={false}
                        className="landing-button-primary justify-between px-5 py-4 text-base"
                      >
                        Open live demo
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                      <a
                        href="#quickstart"
                        className="landing-button-secondary justify-between px-5 py-4 text-base"
                      >
                        Run quickstart
                        <TerminalSquare className="h-5 w-5 text-slate-400" />
                      </a>
                      <a
                        href={DOCS_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="landing-button-secondary justify-between px-5 py-4 text-base"
                      >
                        Read docs
                        <BookOpen className="h-5 w-5 text-slate-400" />
                      </a>
                      <a
                        href={GITHUB_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="landing-button-secondary justify-between px-5 py-4 text-base"
                      >
                        View GitHub
                        <Github className="h-5 w-5 text-slate-400" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </MotionIn>
          </div>
        </section>
      </main>
    </div>
  );
}
