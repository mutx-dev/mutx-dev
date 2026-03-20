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
import { LoginDisabledButton } from "@/components/landing/LoginDisabledButton";
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
  "Open source",
  "Mounted `/v1/*` contract",
  "CLI + TUI included",
  "Public `/app` dashboard demo",
] as const;

const heroNotes = [
  {
    title: "What you are seeing",
    body: "The centerpiece is your actual repo `demo.gif`, not a generated placeholder.",
  },
  {
    title: "Why it matters",
    body: "MUTX is about real operator state: deployments, sessions, access, connectors, audit, and usage.",
  },
  {
    title: "How to verify",
    body: "Run the quickstart, open `/app`, and operate the same system contract from the terminal.",
  },
] as const;

const capabilityPanels = [
  {
    eyebrow: "Deploy",
    title: "Turn agents into durable resources.",
    body: "Templates, deployments, rollout posture, and runtime health belong in the same system of record.",
    points: [
      "Starter template and one-shot deploy path",
      "Local and hosted lanes converge on the same control plane",
      "Sessions and health stay tied to the deployment story",
    ],
    icon: ShieldCheck,
  },
  {
    eyebrow: "Observe",
    title: "Read the fleet like infrastructure.",
    body: "MUTX is built around runtime visibility instead of a fake chat-first shell.",
    points: [
      "Live session and operator signal model",
      "Usage, incidents, and audit in one operator language",
      "Public browser demo backed by the same product narrative",
    ],
    icon: Radar,
  },
  {
    eyebrow: "Govern",
    title: "Keep integrations and access inside the frame.",
    body: "Channels, connectors, keys, and webhooks need explicit ownership and operator boundaries.",
    points: [
      "Connector and webhook posture made legible",
      "Auth and sign-in lanes separated from the public demo",
      "CLI and TUI remain recoverable when the web surface is not enough",
    ],
    icon: Workflow,
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

type SectionHeadingProps = {
  label: string;
  title: string;
  body: string;
};

function SectionHeading({ label, title, body }: SectionHeadingProps) {
  return (
    <div className="max-w-3xl">
      <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-cyan-200">
        {label}
      </div>
      <h2 className="mt-5 font-[family:var(--font-landing-display)] text-4xl font-semibold tracking-[-0.08em] text-white sm:text-5xl">
        {title}
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-8 text-slate-400">
        {body}
      </p>
    </div>
  );
}

type CapabilityPanelProps = {
  eyebrow: string;
  title: string;
  body: string;
  points: readonly string[];
  icon: LucideIcon;
};

function CapabilityPanel({
  eyebrow,
  title,
  body,
  points,
  icon: Icon,
}: CapabilityPanelProps) {
  return (
    <article className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-6 shadow-[0_24px_80px_rgba(2,6,23,0.2)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-[family:var(--font-landing-mono)] text-[0.68rem] uppercase tracking-[0.28em] text-slate-500">
            {eyebrow}
          </p>
          <h3 className="mt-4 font-[family:var(--font-landing-display)] text-3xl font-semibold tracking-[-0.06em] text-white">
            {title}
          </h3>
        </div>
        <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/10 p-3 text-cyan-200">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-300">{body}</p>

      <div className="mt-6 grid gap-3">
        {points.map((point) => (
          <div
            key={point}
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300"
          >
            {point}
          </div>
        ))}
      </div>
    </article>
  );
}

function DeviceShowcase() {
  return (
    <div className="relative mt-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[8%] top-[8%] h-40 rounded-full bg-cyan-400/16 blur-[110px] sm:h-56"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[18%] bottom-10 h-16 rounded-full bg-black/70 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto w-full max-w-5xl transform-gpu md:[transform:perspective(2200px)_rotateX(4deg)]">
          <div className="rounded-[2.4rem] border border-white/20 bg-[linear-gradient(180deg,rgba(219,228,237,0.98)_0%,rgba(157,169,181,0.98)_42%,rgba(116,128,141,0.98)_100%)] p-[10px] shadow-[0_40px_120px_rgba(2,6,23,0.45)]">
            <div className="relative overflow-hidden rounded-[2rem] border border-black/35 bg-[linear-gradient(180deg,#151b22_0%,#090d12_100%)] px-3 pb-4 pt-6 sm:px-4 sm:pb-5 sm:pt-7">
              <div className="absolute left-1/2 top-3 h-2 w-2 -translate-x-1/2 rounded-full bg-black/80 shadow-[0_0_0_2px_rgba(255,255,255,0.05)]" />

              <div className="relative overflow-hidden rounded-[1.4rem] border border-white/10 bg-[#050b12] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0))]" />
                <img
                  src="/demo.gif"
                  alt="Animated MUTX dashboard demo"
                  width={1280}
                  height={801}
                  className="relative z-0 block h-auto w-full"
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.04)_18%,transparent_34%,transparent_100%)] opacity-60 mix-blend-screen" />
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 px-2 sm:px-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-2xl border border-black/10 bg-white/70 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
                    <Image
                      src="/logo.png"
                      alt="MUTX logo"
                      fill
                      sizes="2.5rem"
                      className="object-contain p-0.5"
                    />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="truncate font-[family:var(--font-landing-mono)] text-[0.66rem] uppercase tracking-[0.28em] text-slate-500">
                      MUTX control plane
                    </p>
                    <p className="truncate text-sm font-medium text-slate-800">
                      Actual dashboard demo.gif
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-black/10 bg-white/55 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                    1280 × 801
                  </span>
                  <span className="rounded-full border border-black/10 bg-white/55 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                    Operator surface
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto hidden w-full max-w-4xl flex-col items-center sm:flex">
          <div className="h-20 w-24 bg-[linear-gradient(180deg,rgba(159,171,184,0.98)_0%,rgba(102,113,126,0.98)_100%)] shadow-[0_24px_48px_rgba(2,6,23,0.35)] [clip-path:polygon(24%_0%,76%_0%,100%_100%,0_100%)]" />
          <div className="-mt-3 h-5 w-64 rounded-full bg-[linear-gradient(180deg,rgba(167,179,191,0.95)_0%,rgba(105,116,127,0.95)_100%)] shadow-[0_16px_40px_rgba(2,6,23,0.3)]" />
        </div>
      </div>
    </div>
  );
}

function LandingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#07101a]/86 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 shadow-[0_14px_30px_rgba(2,6,23,0.25)]">
            <Image
              src="/logo.png"
              alt="MUTX logo"
              fill
              sizes="2.75rem"
              className="object-contain p-0.5"
            />
          </div>
          <div>
            <p className="font-[family:var(--font-landing-mono)] text-[0.7rem] uppercase tracking-[0.34em] text-slate-300">
              MUTX
            </p>
            <p className="text-sm font-medium text-slate-500">
              Control plane for agent ops
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
          <LoginDisabledButton className="hidden sm:block" />
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
            className="inline-flex rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(34,211,238,0.22)] transition hover:bg-cyan-300"
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
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} min-h-screen bg-[#03070d] text-white [font-family:var(--font-landing-body)]`}
    >
      <div aria-hidden="true" className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(36,144,171,0.26),transparent_24%),radial-gradient(circle_at_100%_8%,rgba(18,97,123,0.2),transparent_22%),linear-gradient(180deg,#06111a_0%,#03070d_56%,#020509_100%)]" />
        <div className="absolute inset-0 opacity-[0.13] [background-image:linear-gradient(rgba(118,148,167,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(118,148,167,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute left-[-12%] top-[12%] h-[32rem] w-[32rem] rounded-full bg-cyan-500/10 blur-[130px]" />
        <div className="absolute right-[-10%] top-[18%] h-[26rem] w-[26rem] rounded-full bg-sky-400/8 blur-[130px]" />
      </div>

      <LandingNav />

      <main className="relative z-10">
        <section className="px-4 pb-20 pt-32 sm:px-6 sm:pt-36 lg:px-8 lg:pb-24 lg:pt-40">
          <div className="mx-auto max-w-7xl">
            <div className="overflow-hidden rounded-[44px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,18,28,0.96)_0%,rgba(5,11,17,0.98)_100%)] px-5 py-6 shadow-[0_44px_140px_rgba(2,6,23,0.5)] sm:px-8 sm:py-8 lg:px-10 lg:py-10">
              <div className="mx-auto max-w-5xl text-center">
                <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-cyan-200">
                  Assistant-first operator control plane
                </div>

                <h1 className="mx-auto mt-6 max-w-4xl font-[family:var(--font-landing-display)] text-5xl font-semibold leading-[0.92] tracking-[-0.09em] text-white sm:text-6xl xl:text-[5.4rem]">
                  Control deployed agents
                  <span className="block text-cyan-300">
                    like production systems.
                  </span>
                </h1>

                <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl sm:leading-9">
                  MUTX gives you one operator layer for deployments, runs,
                  sessions, access, connectors, audit, and usage. Same control
                  plane. Same contract. Web, CLI, TUI.
                </p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/app"
                    className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-7 py-4 text-base font-semibold text-slate-950 shadow-[0_22px_48px_rgba(34,211,238,0.24)] transition hover:bg-cyan-300"
                  >
                    Open live demo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="#quickstart"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-7 py-4 text-base font-semibold text-white transition hover:border-white/15 hover:bg-white/[0.05]"
                  >
                    Run quickstart
                    <TerminalSquare className="h-4 w-4" />
                  </a>
                  <a
                    href={DOCS_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-7 py-4 text-base font-semibold text-white transition hover:border-white/15 hover:bg-white/[0.05]"
                  >
                    Read docs
                    <BookOpen className="h-4 w-4" />
                  </a>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                  {heroProof.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-[family:var(--font-landing-mono)] text-[11px] uppercase tracking-[0.18em] text-slate-400"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <DeviceShowcase />

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                {heroNotes.map((note) => (
                  <div
                    key={note.title}
                    className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5"
                  >
                    <p className="font-[family:var(--font-landing-mono)] text-[0.66rem] uppercase tracking-[0.28em] text-slate-500">
                      {note.title}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      {note.body}
                    </p>
                  </div>
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
                title="The operator layer around your agent stack."
                body="This is not another wrapper for model calls. MUTX is the control-plane surface that makes deploys, observability, and governance read as one coherent product."
              />
            </MotionIn>

            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {capabilityPanels.map((panel, index) => (
                <MotionIn key={panel.title} delay={0.04 * index}>
                  <CapabilityPanel {...panel} />
                </MotionIn>
              ))}
            </div>
          </div>
        </section>

        <section id="quickstart" className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:items-start">
            <MotionIn>
              <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.02)_100%)] p-6 shadow-[0_30px_90px_rgba(2,6,23,0.24)] lg:p-8">
                <SectionHeading
                  label="Quickstart"
                  title="Pick a lane. Land on the same runtime."
                  body="Hosted operator, local contributor, or direct API contract. The point is not the path. The point is arriving at a live assistant with a visible control surface."
                />

                <div className="mt-8 rounded-[26px] border border-white/10 bg-black/20 p-5">
                  <p className="font-[family:var(--font-landing-mono)] text-[0.68rem] uppercase tracking-[0.28em] text-slate-500">
                    Mounted contract
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {contractPills.map((route) => (
                      <span
                        key={route}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-[family:var(--font-landing-mono)] text-[11px] text-slate-300"
                      >
                        {route}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <p className="text-sm font-semibold text-white">
                        Local-first today
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        Quickest truthful path is still local setup, CLI, TUI,
                        and the public app demo.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <p className="text-sm font-semibold text-white">
                        Hosted auth later
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        Public sign-in stays disabled until the hosted operator
                        lane is worth exposing.
                      </p>
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
            <MotionIn>
              <SectionHeading
                label="Control Loop"
                title="Observe. Direct. Recover."
                body="MUTX should read the same way across the browser, the terminal, and the route contract. The operational loop is the product."
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
              <div className="overflow-hidden rounded-[40px] border border-white/10 bg-[linear-gradient(135deg,rgba(12,33,46,0.94)_0%,rgba(4,11,18,0.96)_52%,rgba(8,21,31,0.94)_100%)] p-6 shadow-[0_34px_110px_rgba(2,6,23,0.32)] lg:p-8">
                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.92fr)] lg:items-end">
                  <div>
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.04] shadow-[0_18px_40px_rgba(2,6,23,0.28)]">
                        <Image
                          src="/logo.png"
                          alt="MUTX logo"
                          fill
                          sizes="4rem"
                          className="object-contain p-1"
                        />
                      </div>
                      <div>
                        <p className="font-[family:var(--font-landing-mono)] text-[0.72rem] uppercase tracking-[0.34em] text-slate-300">
                          MUTX
                        </p>
                        <p className="text-sm text-slate-500">
                          Run the real thing
                        </p>
                      </div>
                    </div>

                    <h2 className="mt-6 font-[family:var(--font-landing-display)] text-4xl font-semibold tracking-[-0.08em] text-white sm:text-5xl">
                      Start with the control plane.
                    </h2>
                    <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                      Bring the stack up, launch the assistant, inspect the
                      public demo, then work the same runtime from web, CLI, or
                      TUI.
                    </p>
                    <pre className="mt-6 overflow-x-auto whitespace-pre-wrap break-words rounded-[28px] border border-white/10 bg-[#04101a] px-5 py-5 font-[family:var(--font-landing-mono)] text-[13px] leading-7 text-slate-100">
                      {`make dev-up
mutx setup local
mutx doctor
mutx tui`}
                    </pre>
                  </div>

                  <div className="space-y-3">
                    <Link
                      href="/app"
                      className="flex items-center justify-between rounded-[22px] border border-cyan-400/20 bg-cyan-400 px-5 py-4 text-base font-semibold text-slate-950 transition hover:bg-cyan-300"
                    >
                      Open live demo
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                    <a
                      href="#quickstart"
                      className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4 text-base font-semibold text-white transition hover:border-white/15 hover:bg-white/[0.05]"
                    >
                      Run quickstart
                      <TerminalSquare className="h-5 w-5 text-slate-500" />
                    </a>
                    <a
                      href={DOCS_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4 text-base font-semibold text-white transition hover:border-white/15 hover:bg-white/[0.05]"
                    >
                      Read docs
                      <BookOpen className="h-5 w-5 text-slate-500" />
                    </a>
                    <a
                      href={GITHUB_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4 text-base font-semibold text-white transition hover:border-white/15 hover:bg-white/[0.05]"
                    >
                      Star on GitHub
                      <Github className="h-5 w-5 text-slate-500" />
                    </a>
                    <LoginDisabledButton className="w-full [&>button]:flex [&>button]:w-full [&>button]:justify-between [&>button]:rounded-[22px] [&>button]:px-5 [&>button]:py-4 [&>button]:text-base" />
                  </div>
                </div>

                <footer className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-8 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-[family:var(--font-landing-mono)] uppercase tracking-[0.28em] text-slate-300">
                      MUTX
                    </span>
                    <span>Open Source</span>
                    <span>MIT License</span>
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
