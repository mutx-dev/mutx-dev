import Image from "next/image";
import Link from "next/link";
import { IBM_Plex_Mono, IBM_Plex_Sans, Syne } from "next/font/google";
import {
  ArrowRight,
  BookOpen,
  Cable,
  Github,
  Radar,
  ShieldCheck,
  TerminalSquare,
  Webhook,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ControlLoopTabs } from "@/components/landing/ControlLoopTabs";
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
  { label: "Why MUTX", href: "#why-mutx" },
  { label: "Quickstart", href: "#quickstart" },
  { label: "Control Loop", href: "#control-loop" },
] as const;

const heroProof = [
  "Deployments",
  "Sessions",
  "Access",
  "Audit",
] as const;

const heroRail = [
  {
    label: "Deployments",
    body: "Track rollout posture, version history, and health in one operator view.",
  },
  {
    label: "Sessions",
    body: "Read live assistant activity, incidents, and usage without switching surfaces.",
  },
  {
    label: "Access",
    body: "Keep auth, connectors, keys, and audit inside the same control plane.",
  },
] as const;

const capabilityPanels = [
  {
    eyebrow: "Deploy",
    title: "Treat assistants like durable runtime resources.",
    body: "Starter deployments, rollout posture, and runtime health sit in one system of record.",
    icon: ShieldCheck,
  },
  {
    eyebrow: "Observe",
    title: "Read the fleet like infrastructure.",
    body: "Sessions, logs, health, and usage show up as operator state instead of chat veneer.",
    icon: Radar,
  },
  {
    eyebrow: "Govern",
    title: "Keep boundaries explicit.",
    body: "Access, connectors, keys, and webhooks stay visible inside the same frame as the runtime.",
    icon: Workflow,
  },
] as const;

const visibleBoundaryItems = [
  "Deployment posture",
  "Session state",
  "Connector ownership",
  "Audit and usage",
] as const;

const operatorChecklist = [
  {
    step: "01",
    title: "Bring up a control plane",
    body: "Hosted, local, or raw API contract. Pick the fastest truthful lane.",
  },
  {
    step: "02",
    title: "Deploy Personal Assistant",
    body: "Land on a live assistant instead of an empty shell.",
  },
  {
    step: "03",
    title: "Inspect the operator surface",
    body: "Use the browser demo, CLI, or TUI against the same runtime story.",
  },
] as const;

const contractPills = [
  "/v1/templates",
  "/v1/assistant",
  "/v1/sessions",
  "/v1/deployments",
  "/v1/auth",
  "/v1/webhooks",
] as const;

const surfacePills = [
  "Browser demo",
  "CLI",
  "TUI",
  "`/v1/*` contract",
] as const;

const launchMeta = [
  "Open source",
  "MIT license",
  "Public live demo",
  "Operator docs",
] as const;

type SectionHeadingProps = {
  label: string;
  title: string;
  body: string;
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
      <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300/80">
        {body}
      </p>
    </div>
  );
}

type CapabilityTileProps = {
  eyebrow: string;
  title: string;
  body: string;
  icon: LucideIcon;
};

function CapabilityTile({
  eyebrow,
  title,
  body,
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
      <p className="mt-4 text-sm leading-7 text-slate-300/80">{body}</p>
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
                    MUTX gives you one operator surface for deployments,
                    sessions, access, connectors, audit, and usage across web,
                    CLI, and TUI.
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

                  <div className="mt-8 flex flex-wrap items-center gap-2">
                    {heroProof.map((item) => (
                      <span key={item} className="landing-chip">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <HeroMonitorShowcase className="xl:-mr-8" />
              </div>

              <div className="relative mt-8 grid gap-4 lg:grid-cols-3">
                {heroRail.map((item, index) => (
                  <MotionIn key={item.label} delay={0.05 * index}>
                    <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.03] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                      <p className="font-[family:var(--font-landing-mono)] text-[0.66rem] uppercase tracking-[0.28em] text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-slate-300/85">
                        {item.body}
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
                title="One operator model for deploy, observe, and govern."
                body="MUTX is for teams that want deployed assistants to read like systems with visible state, boundaries, and recovery paths."
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
                    <p className="landing-kicker">Operator model</p>
                    <h3 className="mt-4 font-[family:var(--font-landing-display)] text-3xl font-semibold tracking-[-0.07em] text-white sm:text-[2.35rem]">
                      The runtime should read like a system, not a chat shell.
                    </h3>
                    <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300/80">
                      MUTX keeps starter deployments, runtime health, session
                      state, access boundaries, and audit in one operator
                      surface so the story stays coherent from setup to recovery.
                    </p>

                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                      {capabilityPanels.map((panel) => (
                        <CapabilityTile key={panel.eyebrow} {...panel} />
                      ))}
                    </div>
                  </div>
                </article>
              </MotionIn>

              <div className="grid gap-5">
                <MotionIn delay={0.05}>
                  <article className="landing-panel p-6">
                    <p className="landing-kicker">Surface continuity</p>
                    <h3 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-white">
                      Same runtime, more than one surface.
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-slate-300/80">
                      Open the live demo, inspect the routes, or operate through
                      CLI and TUI without changing how the runtime is described.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {["Public demo", "CLI operations", "TUI recovery"].map(
                        (item) => (
                          <span key={item} className="landing-chip">
                            {item}
                          </span>
                        ),
                      )}
                    </div>
                  </article>
                </MotionIn>

                <MotionIn delay={0.1}>
                  <article className="landing-panel p-6">
                    <p className="landing-kicker">Visible boundaries</p>
                    <h3 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-white">
                      What stops being hand-wavy.
                    </h3>
                    <div className="mt-5 grid gap-3">
                      {visibleBoundaryItems.map((item) => (
                        <div
                          key={item}
                          className="rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3 text-sm font-medium text-slate-200"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </article>
                </MotionIn>
              </div>
            </div>
          </div>
        </section>

        <section id="quickstart" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] xl:items-start">
            <MotionIn>
              <div className="landing-panel p-6 lg:p-8">
                <SectionHeading
                  label="Quickstart"
                  title="Pick the lane that lands on the real runtime."
                  body="Use the fastest truthful path, then inspect the same assistant surface from the browser, CLI, or TUI."
                />

                <div className="mt-8 space-y-4">
                  <div className="rounded-[1.9rem] border border-white/10 bg-black/20 p-5">
                    <p className="landing-kicker">Operator checklist</p>
                    <div className="mt-5 grid gap-3">
                      {operatorChecklist.map((item) => (
                        <div
                          key={item.step}
                          className="grid gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.03] px-4 py-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start"
                        >
                          <div className="font-[family:var(--font-landing-mono)] text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200">
                            {item.step}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {item.title}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-400">
                              {item.body}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.9rem] border border-white/10 bg-black/20 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="landing-kicker">Mounted contract</p>
                      <p className="max-w-xs text-sm leading-6 text-slate-400">
                        Hosted auth is still hardening. Local and API lanes
                        already land on the real runtime.
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {contractPills.map((route) => (
                        <span key={route} className="landing-chip">
                          {route}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </MotionIn>

            <MotionIn delay={0.06}>
              <QuickstartTabs />
            </MotionIn>
          </div>
        </section>

        <section id="control-loop" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <MotionIn>
                <SectionHeading
                  label="Control Loop"
                  title="Operate in one loop, not three disconnected tools."
                  body="Deploy, observe, and recover without changing the story between browser, terminal, and route contract."
                />
              </MotionIn>

              <MotionIn delay={0.04}>
                <div className="flex max-w-xl flex-wrap gap-2 lg:justify-end">
                  {surfacePills.map((item) => (
                    <span key={item} className="landing-chip">
                      {item}
                    </span>
                  ))}
                </div>
              </MotionIn>
            </div>

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
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 overflow-hidden rounded-[1.5rem] border border-cyan-300/15 bg-[linear-gradient(180deg,rgba(230,238,246,0.22)_0%,rgba(96,113,130,0.16)_100%)] p-2 shadow-[0_18px_40px_rgba(34,211,238,0.14)] ring-1 ring-inset ring-white/8">
                        <div className="absolute inset-[1px] rounded-[1.4rem] bg-[radial-gradient(circle_at_50%_20%,rgba(103,232,249,0.14),transparent_56%),linear-gradient(180deg,rgba(15,23,42,0.94)_0%,rgba(4,10,18,0.96)_100%)]" />
                        <Image
                          src="/logo.png"
                          alt="MUTX logo"
                          fill
                          sizes="4rem"
                          className="relative z-10 object-contain p-1 brightness-[1.12] contrast-[1.06]"
                        />
                      </div>
                      <div>
                        <p className="landing-kicker">Launch rail</p>
                        <p className="text-sm text-slate-300/80">
                          Start where the runtime is already live.
                        </p>
                      </div>
                    </div>

                    <h2 className="mt-6 font-[family:var(--font-landing-display)] text-4xl font-semibold tracking-[-0.08em] text-white sm:text-5xl">
                      Bring the stack up. Validate the surface. Keep operating.
                    </h2>
                    <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300/80">
                      Use the local quickstart to stand the runtime up, inspect
                      the live demo, then keep the same control-plane story in
                      the terminal.
                    </p>

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

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-4">
                        <p className="landing-kicker">What you get</p>
                        <p className="mt-3 text-sm leading-6 text-slate-300/80">
                          A real operator surface in the browser plus the same
                          runtime story in CLI and TUI.
                        </p>
                      </div>
                      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] px-4 py-4">
                        <p className="landing-kicker">What stays honest</p>
                        <p className="mt-3 text-sm leading-6 text-slate-300/80">
                          Deployments, sessions, access, connectors, audit, and
                          usage stay inside one visible frame.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <footer className="relative mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-[family:var(--font-landing-mono)] uppercase tracking-[0.28em] text-slate-300">
                      MUTX
                    </span>
                    {launchMeta.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-5">
                    <a
                      href={GITHUB_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="transition hover:text-white"
                    >
                      GitHub
                    </a>
                    <a
                      href={DOCS_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="transition hover:text-white"
                    >
                      Documentation
                    </a>
                    <span className="inline-flex items-center gap-2 text-slate-500">
                      <Webhook className="h-4 w-4" />
                      Connectors
                    </span>
                    <span className="inline-flex items-center gap-2 text-slate-500">
                      <Cable className="h-4 w-4" />
                      Channels
                    </span>
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
