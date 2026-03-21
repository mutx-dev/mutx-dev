import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Github, Mail, PhoneCall, TerminalSquare } from "lucide-react";

import { ContactLeadForm } from "@/components/ContactLeadForm";
import { CalendlyPopupButton } from "@/components/site/CalendlyPopupButton";
import { PublicFooter } from "@/components/site/PublicFooter";
import { SiteReveal } from "@/components/site/SiteReveal";

const GITHUB_URL = "https://github.com/mutx-dev/mutx-dev";
const DOCS_URL = "https://docs.mutx.dev";
const CONTACT_EMAIL = "hello@mutx.dev";

export const metadata: Metadata = {
  title: "Contact | MUTX",
  description:
    "Contact MUTX for hosted evaluations, design-partner workflows, partnerships, contributions, and serious operator conversations.",
};

const inquiryTracks = [
  {
    title: "Hosted evaluation",
    body: "Show us the deployment, auth, trace, or runtime problem you need to validate in a real control plane.",
  },
  {
    title: "Design partner lane",
    body: "Bring the workflow that keeps breaking and the success condition you need to prove before rollout.",
  },
  {
    title: "Infrastructure partnership",
    body: "If MUTX should fit into a broader stack, ecosystem, or operator platform, spell out the integration angle clearly.",
  },
  {
    title: "Open-source contribution",
    body: "Code, docs, design, infrastructure, and product sharpness all count when they move the control plane forward.",
  },
] as const;

const directChannels = [
  {
    title: "Email",
    body: "Use direct email if you already know the conversation you need to have.",
    href: `mailto:${CONTACT_EMAIL}`,
    label: CONTACT_EMAIL,
    icon: Mail,
  },
  {
    title: "Docs",
    body: "Inspect the current route surface, install flow, and product truth before you write the note.",
    href: DOCS_URL,
    label: "docs.mutx.dev",
    icon: BookOpen,
  },
  {
    title: "Quickstart",
    body: "Take the shortest local proof path before the conversation turns into architecture review.",
    href: "/#install",
    label: "install flow",
    icon: TerminalSquare,
  },
  {
    title: "GitHub",
    body: "Review the repo, issues, and current shipping state without waiting for a summary deck.",
    href: GITHUB_URL,
    label: "mutx-dev/mutx-dev",
    icon: Github,
  },
] as const;

const requestChecklist = [
  "Who you are, who else is involved, and what environment you operate.",
  "The exact deployment, auth, webhook, or runtime workflow that is causing pain.",
  "What success looks like on your side if MUTX works.",
  "Timeline, constraints, and anything that would kill the evaluation early.",
] as const;

export default function ContactPage() {
  return (
    <div className="site-page">
      <main className="site-main">
        <section className="site-section pt-20 sm:pt-24 lg:pt-28">
          <div className="site-shell space-y-8">
            <SiteReveal>
              <div className="site-section-intro">
                <div className="site-kicker">Contact MUTX</div>
                <h1 className="site-title mt-4">
                  Bring the rollout that keeps eating your week.
                </h1>
                <p className="site-copy mt-4 max-w-3xl">
                  Use this page when a rollout stopped being a demo and started
                  touching auth, deployments, traces, runtimes, or ownership
                  questions that need a real operator answer.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <CalendlyPopupButton className="site-button-accent w-full sm:w-auto">
                    Book a call
                    <PhoneCall className="h-4 w-4" />
                  </CalendlyPopupButton>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="site-button-secondary w-full sm:w-auto"
                  >
                    Email MUTX
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </SiteReveal>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {inquiryTracks.map((track, index) => (
                <SiteReveal key={track.title} delay={0.04 + index * 0.04}>
                  <article className="site-panel p-5">
                    <h2 className="text-lg font-semibold tracking-[-0.04em] text-white">
                      {track.title}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--site-text-soft)]">
                      {track.body}
                    </p>
                  </article>
                </SiteReveal>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]">
              <SiteReveal delay={0.08}>
                <ContactLeadForm />
              </SiteReveal>

              <div className="grid gap-4">
                <SiteReveal delay={0.12}>
                  <article className="site-panel p-6">
                    <div className="site-kicker">What to include</div>
                    <h2 className="mt-4 text-2xl font-semibold tracking-[-0.05em] text-white">
                      Make the first message useful.
                    </h2>
                    <div className="mt-5 grid gap-3">
                      {requestChecklist.map((item) => (
                        <div key={item} className="site-inline-card">
                          {item}
                        </div>
                      ))}
                    </div>
                  </article>
                </SiteReveal>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  {directChannels.map((item, index) => (
                    <SiteReveal key={item.title} delay={0.14 + index * 0.03}>
                      <a
                        href={item.href}
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                        className="site-link-card"
                      >
                        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-3">
                          <item.icon className="h-4 w-4 text-[color:var(--site-accent)]" />
                        </div>
                        <div>
                          <h3 className="site-link-card-title">{item.title}</h3>
                          <p className="site-link-card-body mt-2">{item.body}</p>
                        </div>
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                          {item.label}
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </a>
                    </SiteReveal>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-[color:var(--site-text-muted)]">
              <Link href="/" className="site-nav-link">
                Back to mutx.dev
              </Link>
              <a href={DOCS_URL} target="_blank" rel="noreferrer" className="site-nav-link">
                Documentation
              </a>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="site-nav-link">
                Repository
              </a>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
