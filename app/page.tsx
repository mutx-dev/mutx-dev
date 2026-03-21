import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Binary,
  BookOpen,
  Boxes,
  GitBranch,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";

import { CalendlyPopupButton } from "@/components/site/CalendlyPopupButton";
import { CommandCopyButton } from "@/components/site/CommandCopyButton";
import { ComingSoonButton } from "@/components/site/ComingSoonButton";
import { PublicFooter } from "@/components/site/PublicFooter";
import { SiteReveal } from "@/components/site/SiteReveal";

const DOCS_URL = "https://docs.mutx.dev";
const GITHUB_URL = "https://github.com/mutx-dev/mutx-dev";

const heroSignals = [
  {
    label: "Auth boundary",
    value: "keys, sessions, and ownership stay attached to real routes.",
  },
  {
    label: "Deployment posture",
    value: "inspect health, restarts, logs, and version drift before it spills.",
  },
  {
    label: "Trace diagnosis",
    value: "follow a run from operator action to receipt instead of guessing.",
  },
] as const;

const surfaceCards = [
  {
    icon: ShieldCheck,
    title: "Auth with receipts",
    body: "Session auth, API keys, and ownership-aware access stop being a side quest you only notice after the demo closes.",
  },
  {
    icon: GitBranch,
    title: "Deployments with memory",
    body: "Track what shipped, what warmed, what rolled back, and who touched the runtime when the handoff gets tense.",
  },
  {
    icon: Binary,
    title: "Trace the weird part",
    body: "Run history, traces, and webhook receipts make the failure legible instead of forcing another round of screenshot archaeology.",
  },
] as const;

const installCards = [
  {
    label: "Recommended quickstart",
    caption: "one command · hosted lane",
    command: `curl -fsSL https://mutx.dev/install.sh | bash`,
    note: "The MUTX installer stays in the same terminal, recommends Hosted, installs or imports OpenClaw, and opens the operator TUI for you.",
  },
  {
    label: "Already running OpenClaw?",
    caption: "advanced reuse path",
    command: `mutx setup hosted --import-openclaw`,
    note: "Use this after install if OpenClaw is already on the machine and you want MUTX to adopt it without reinstalling anything.",
  },
] as const;

const launchCards = [
  {
    icon: BookOpen,
    title: "Read the docs",
    body: "Start with the route contract, install path, and operational references before you touch anything hosted.",
    href: DOCS_URL,
    external: true,
  },
  {
    icon: Boxes,
    title: "Read the repo",
    body: "Web, API, CLI, SDK, and infra live together so the product truth is inspectable when things get weird.",
    href: GITHUB_URL,
    external: true,
  },
] as const;

const routePills = [
  "/v1/auth",
  "/v1/agents",
  "/v1/deployments",
  "/v1/runs/{id}/traces",
  "/v1/webhooks",
] as const;

type SectionIntroProps = {
  eyebrow: string;
  title: string;
  body: string;
};

function SectionIntro({ eyebrow, title, body }: SectionIntroProps) {
  return (
    <div className="site-section-intro">
      <div className="site-kicker">{eyebrow}</div>
      <h2 className="site-section-heading">{title}</h2>
      <p className="site-copy mt-4 max-w-3xl">{body}</p>
    </div>
  );
}

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  body: string;
};

function FeatureCard({ icon: Icon, title, body }: FeatureCardProps) {
  return (
    <article className="site-panel p-5 sm:p-6">
      <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-3">
        <Icon className="h-4 w-4 text-[color:var(--site-accent)]" />
      </div>
      <h3 className="mt-4 text-xl font-semibold tracking-[-0.04em] text-white">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-[color:var(--site-text-soft)]">
        {body}
      </p>
    </article>
  );
}

type InstallCardProps = {
  label: string;
  caption: string;
  command: string;
  note: string;
};

function InstallCard({ label, caption, command, note }: InstallCardProps) {
  return (
    <article className="site-command-card">
      <div className="site-command-card-head">
        <div>
          <p>{label}</p>
          <p>{caption}</p>
        </div>
        <div className="site-command-card-actions">
          <CommandCopyButton value={command} />
        </div>
      </div>
      <pre>{command}</pre>
      <p className="mt-4 text-sm leading-7 text-[color:var(--site-text-soft)]">
        {note}
      </p>
    </article>
  );
}

type LaunchCardProps = {
  icon: LucideIcon;
  title: string;
  body: string;
  href: string;
  external: boolean;
};

function LaunchCard({
  icon: Icon,
  title,
  body,
  href,
  external,
}: LaunchCardProps) {
  const content = (
    <>
      <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-3">
        <Icon className="h-4 w-4 text-[color:var(--site-accent)]" />
      </div>
      <div>
        <h3 className="site-link-card-title">{title}</h3>
        <p className="site-link-card-body mt-2">{body}</p>
      </div>
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
        Open
        <ArrowRight className="h-4 w-4" />
      </span>
    </>
  );

  return external ? (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="site-link-card"
    >
      {content}
    </a>
  ) : (
    <Link href={href} className="site-link-card">
      {content}
    </Link>
  );
}

export default function LandingPage() {
  return (
    <div className="site-page">
      <main className="site-main">
        <section className="site-section pb-10 pt-20 sm:pt-24 lg:pt-28">
          <div className="site-shell">
            <div className="site-hero-grid">
              <div className="site-hero-copy">
                <div className="max-w-[36rem]">
                  <div className="site-kicker">
                    Deploy agents without hiding the ugly parts
                  </div>
                  <h1 className="site-title mt-5">
                    The control plane for agents that have to survive
                    production.
                  </h1>
                  <p className="site-copy mt-5 max-w-2xl">
                    MUTX makes auth, deployments, traces, webhooks, runtime
                    posture, and operator workflows legible before the rollout
                    becomes a fire drill.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <a
                    href={DOCS_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="site-button-primary w-full sm:w-auto"
                  >
                    Read docs
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <CalendlyPopupButton className="site-button-accent w-full sm:w-auto">
                    Book a call
                    <PhoneCall className="h-4 w-4" />
                  </CalendlyPopupButton>
                  <ComingSoonButton className="w-full sm:w-auto">
                    Dashboard soon
                  </ComingSoonButton>
                </div>

                <p className="text-sm text-[color:var(--site-text-muted)]">
                  Need a guided rollout or a hosted evaluation?{" "}
                  <Link href="/contact" className="site-inline-link">
                    Contact MUTX
                  </Link>
                  .
                </p>
              </div>

              <SiteReveal className="site-hero-visual">
                <div className="site-demo-frame">
                  <div className="site-demo-shell">
                    <div className="site-demo-header">
                      <div className="site-demo-title">
                        <div className="site-demo-dots" aria-hidden="true">
                          <span />
                          <span />
                          <span />
                        </div>
                        <div>
                          <p className="site-demo-label">Live control surface</p>
                          <p className="text-sm text-[color:var(--site-text-soft)]">
                            dashboard, deployments, traces, receipts
                          </p>
                        </div>
                      </div>
                      <span className="site-demo-status">live walkthrough</span>
                    </div>

                    <div className="site-demo-screen">
                      <img
                        src="/demo.gif"
                        alt="MUTX operator dashboard demo"
                        width={1280}
                        height={801}
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                        className="site-demo-image"
                      />
                    </div>

                    <div className="site-demo-footer">
                      <p className="site-demo-footer-title">MUTX control surface</p>
                      <div className="site-demo-footer-meta">
                        <span>deployments</span>
                        <span>traces</span>
                        <span>webhooks</span>
                      </div>
                    </div>
                  </div>
                  <div className="site-demo-stand" aria-hidden="true" />
                </div>
              </SiteReveal>

              <div className="site-hero-support">
                <div className="site-command-card">
                  <div className="site-command-card-head">
                    <div>
                      <p>Start here</p>
                      <p>smallest credible proof path</p>
                    </div>
                    <div className="site-command-card-actions">
                      <CommandCopyButton
                        value={`curl -fsSL https://mutx.dev/install.sh | bash`}
                      />
                    </div>
                  </div>
                  <pre>{`curl -fsSL https://mutx.dev/install.sh | bash`}</pre>
                  <p className="mt-4 text-sm leading-7 text-[color:var(--site-text-soft)]">
                    The installer opens the MUTX wizard in the same terminal.
                    Choose <span className="font-semibold text-white">Hosted</span>{" "}
                    unless you explicitly want a private Docker-backed localhost
                    control plane.
                  </p>
                </div>

                <div className="site-signal-grid">
                  {heroSignals.map((item) => (
                    <div key={item.label} className="site-signal-card">
                      <p className="site-signal-label">{item.label}</p>
                      <p className="site-signal-value">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="surface" className="site-section site-defer pt-6">
          <div className="site-shell space-y-8">
            <SiteReveal>
              <SectionIntro
                eyebrow="Why MUTX"
                title="Demos do not page you at 3:14 AM. Deployments do."
                body="The problem is rarely the model in isolation. The real pain shows up in auth boundaries, rollback fear, silent webhook failures, vague ownership, and the moment a promising assistant has to behave like infrastructure."
              />
            </SiteReveal>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
              <SiteReveal delay={0.04}>
                <article className="site-panel-strong overflow-hidden p-5 sm:p-6">
                  <div className="max-w-2xl">
                    <div className="site-kicker">What MUTX keeps legible</div>
                    <h3 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-white sm:text-4xl">
                      Operator truth, not AI pageantry.
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-[color:var(--site-text-soft)] sm:text-base">
                      If a route is live, the public site should point at it. If
                      a workflow is rough, the surface should admit it. That is
                      how you get a control plane people can trust.
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {routePills.map((route) => (
                      <span key={route} className="site-route-pill">
                        {route}
                      </span>
                    ))}
                  </div>

                  <div className="site-figure-frame site-figure-frame-cover mt-6">
                    <Image
                      src="/landing/webp/wiring-bay.webp"
                      alt="MUTX robot wiring a runtime directly into the control plane"
                      fill
                      sizes="(max-width: 1280px) 100vw, 44rem"
                      className="site-hero-art-cover"
                      style={{ objectPosition: "center 38%" }}
                    />
                  </div>
                </article>
              </SiteReveal>

              <div className="grid gap-4 sm:grid-cols-2">
                {surfaceCards.map((card, index) => (
                  <SiteReveal key={card.title} delay={0.06 + index * 0.04}>
                    <FeatureCard {...card} />
                  </SiteReveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="site-section py-0">
          <div className="site-shell">
            <SiteReveal delay={0.08}>
              <article className="site-openclaw-band">
                <div className="site-openclaw-mark">
                  <Image
                    src="/openclaw-mark.svg"
                    alt="OpenClaw"
                    width={72}
                    height={72}
                    sizes="4.5rem"
                    className="h-auto w-full"
                  />
                </div>

                <div className="site-openclaw-copy">
                  <p className="site-openclaw-label">Already running OpenClaw?</p>
                  <p className="site-openclaw-body">
                    MUTX can adopt the local runtime you already trust and put
                    it behind the same operator surface, receipts, and rollout
                    controls as the rest of the stack.
                  </p>
                </div>

                <code className="site-openclaw-command">
                  mutx setup hosted --import-openclaw
                </code>
              </article>
            </SiteReveal>
          </div>
        </section>

        <section id="install" className="site-section site-defer">
          <div className="site-shell space-y-8">
            <SiteReveal>
              <SectionIntro
                eyebrow="Proof Path"
                title="Start with one command, then let MUTX guide the rest."
                body="New to MUTX? Run the installer and choose Hosted. Keep the Docker-backed localhost lane for self-hosting and contributor work."
              />
            </SiteReveal>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)]">
              <div className="grid gap-4">
                {installCards.map((card, index) => (
                  <SiteReveal key={card.label} delay={0.04 + index * 0.04}>
                    <InstallCard {...card} />
                  </SiteReveal>
                ))}
              </div>

              <div className="grid gap-4">
                <SiteReveal delay={0.08}>
                  <article className="site-panel-strong overflow-hidden p-5 sm:p-6">
                    <div className="site-kicker">Docs + routes + operator UI</div>
                    <h3 className="mt-4 text-3xl font-semibold tracking-[-0.06em] text-white">
                      One product, four honest surfaces.
                    </h3>
                    <p className="mt-4 text-sm leading-7 text-[color:var(--site-text-soft)]">
                      MUTX works best when the site, docs, CLI, and API say the
                      same thing about the same system.
                    </p>

                    <div className="site-figure-frame site-figure-frame-cover mt-6">
                      <Image
                        src="/landing/webp/reading-bench.webp"
                        alt="MUTX robot reviewing the proof path before rollout"
                        fill
                        sizes="(max-width: 1280px) 100vw, 34rem"
                        className="site-hero-art-cover"
                        style={{ objectPosition: "center 24%" }}
                      />
                    </div>
                  </article>
                </SiteReveal>

                <div className="grid gap-4">
                  {launchCards.map((card, index) => (
                    <SiteReveal key={card.title} delay={0.1 + index * 0.04}>
                      <LaunchCard {...card} />
                    </SiteReveal>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="site-section site-defer pt-6">
          <div className="site-shell">
            <SiteReveal>
              <article className="site-panel-strong grid gap-6 overflow-hidden p-5 sm:p-6 xl:grid-cols-[minmax(0,1.04fr)_minmax(19rem,0.96fr)] xl:items-center">
                <div>
                  <div className="site-kicker">Close the loop</div>
                  <h2 className="site-section-heading mt-4">
                    Bring the rollout that already escaped the demo.
                  </h2>
                  <p className="site-copy mt-4 max-w-2xl">
                    MUTX is for the moment when the prototype is done, the
                    runtime is behaving like infrastructure, and someone has to
                    make the operator story coherent enough to ship.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link href="/contact" className="site-button-primary">
                      Contact MUTX
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <a
                      href={DOCS_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="site-button-secondary"
                    >
                      Re-read the docs
                    </a>
                    <ComingSoonButton>Dashboard soon</ComingSoonButton>
                  </div>
                </div>

                <div className="site-figure-frame">
                  <Image
                    src="/landing/webp/victory-core.webp"
                    alt="MUTX robot raising the MUTX mark in victory"
                    width={1536}
                    height={1024}
                    sizes="(max-width: 1280px) 100vw, 36rem"
                    className="site-hero-art"
                  />
                </div>
              </article>
            </SiteReveal>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
