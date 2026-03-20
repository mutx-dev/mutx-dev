"use client";

import Link from "next/link";
import { ArrowRight, Bot, KeyRound, Rocket, ShieldCheck } from "lucide-react";

import { AppDashboardClient } from "@/components/app/AppDashboardClient";

const pillars = [
  {
    title: "Assistant first",
    description: "The first thing an operator deploys is Personal Assistant, with lifecycle and recovery state attached from day one.",
    href: "/dashboard/deployments",
    icon: Rocket,
  },
  {
    title: "Control plane truth",
    description: "Sessions, skills, channels, health, and deployments belong in the same product surface, not in side notes.",
    href: "/dashboard/api-keys",
    icon: KeyRound,
  },
  {
    title: "Operator execution",
    description: "The dashboard is one control surface across setup, assistants, deployments, health, and intervention loops.",
    href: "/dashboard/agents",
    icon: Bot,
  },
] as const;

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-[#18253b] bg-[linear-gradient(180deg,rgba(8,15,30,0.98)_0%,rgba(3,8,19,1)_100%)] shadow-[0_30px_120px_rgba(2,6,23,0.55)]">
        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1.3fr)_360px] lg:p-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              MUTX control plane
            </div>

            <h1 className="mt-5 max-w-4xl text-3xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
              Deploy the first assistant like a service. Operate it like a system.
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
              MUTX is the production control plane for AI assistants: starter deployment, lifecycle, governance, and operator workflows in one surface.
              The browser shell should not invent a separate story from the CLI and TUI, so the default path starts with a real assistant instead of an empty dashboard.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard/deployments"
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-2.5 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-400/15"
              >
                View deployments
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard/monitoring"
                className="inline-flex items-center gap-2 rounded-xl border border-[#22314b] bg-[#0a1428] px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-[#2b4366] hover:text-white"
              >
                Check health
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-[#1e2c45] bg-[#091224] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Category truth</p>
              <p className="mt-3 text-sm leading-6 text-slate-200">
                Not another chat skin. MUTX centers assistants, deployments, sessions, skills, keys, and health as first-class resources.
              </p>
            </div>
            <div className="rounded-2xl border border-[#1e2c45] bg-[#091224] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Operator proof</p>
              <p className="mt-3 text-sm leading-6 text-slate-200">
                Assistants get deployments, not just sessions. Operational trust is the product.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t border-[#172238] bg-[#050c18]/80 p-6 md:grid-cols-3 lg:p-8">
          {pillars.map((pillar) => (
            <Link
              key={pillar.title}
              href={pillar.href}
              className="rounded-2xl border border-[#1d2d46] bg-[#091224] p-4 transition hover:border-[#2b4366] hover:bg-[#0b172b]"
            >
              <pillar.icon className="h-5 w-5 text-cyan-300" />
              <p className="mt-4 text-sm font-semibold text-slate-100">{pillar.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{pillar.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <AppDashboardClient />
    </div>
  );
}
