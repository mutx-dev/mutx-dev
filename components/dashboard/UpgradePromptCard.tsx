import Link from "next/link";
import { ArrowRight, BellRing, ShieldAlert, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

import type { UpgradePrompt, UpgradePromptTone } from "@/components/dashboard/upgradeMoments";

function toneClasses(tone: UpgradePromptTone) {
  if (tone === "success") {
    return {
      shell: "border-emerald-400/20 bg-emerald-400/10",
      badge: "border-emerald-300/24 bg-emerald-300/14 text-emerald-100",
      icon: "border-emerald-300/24 bg-emerald-300/12 text-emerald-100",
      primary: "bg-emerald-300 text-[#071018] hover:bg-emerald-200",
      secondary: "border-emerald-300/24 text-emerald-100 hover:border-emerald-200/40 hover:bg-emerald-300/10",
    };
  }

  if (tone === "warning") {
    return {
      shell: "border-amber-400/20 bg-amber-400/10",
      badge: "border-amber-300/24 bg-amber-300/14 text-amber-100",
      icon: "border-amber-300/24 bg-amber-300/12 text-amber-100",
      primary: "bg-amber-300 text-[#151008] hover:bg-amber-200",
      secondary: "border-amber-300/24 text-amber-100 hover:border-amber-200/40 hover:bg-amber-300/10",
    };
  }

  if (tone === "error") {
    return {
      shell: "border-rose-400/20 bg-rose-400/10",
      badge: "border-rose-300/24 bg-rose-300/14 text-rose-100",
      icon: "border-rose-300/24 bg-rose-300/12 text-rose-100",
      primary: "bg-rose-300 text-[#170b10] hover:bg-rose-200",
      secondary: "border-rose-300/24 text-rose-100 hover:border-rose-200/40 hover:bg-rose-300/10",
    };
  }

  return {
    shell: "border-sky-400/20 bg-sky-400/10",
    badge: "border-sky-300/24 bg-sky-300/14 text-sky-100",
    icon: "border-sky-300/24 bg-sky-300/12 text-sky-100",
    primary: "bg-sky-300 text-[#071018] hover:bg-sky-200",
    secondary: "border-sky-300/24 text-sky-100 hover:border-sky-200/40 hover:bg-sky-300/10",
  };
}

function PromptIcon({ tone }: { tone: UpgradePromptTone }) {
  if (tone === "error") {
    return <ShieldAlert className="h-4 w-4" />;
  }

  if (tone === "success") {
    return <Sparkles className="h-4 w-4" />;
  }

  return <BellRing className="h-4 w-4" />;
}

export function UpgradePromptCard({ prompt }: { prompt: UpgradePrompt }) {
  const styles = toneClasses(prompt.tone);

  return (
    <section className={cn("dashboard-entry rounded-[22px] border p-4 sm:p-5", styles.shell)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]", styles.badge)}>
              {prompt.badge}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
              contextual upgrade
            </span>
          </div>
          <div className="mt-3 flex items-start gap-3">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border", styles.icon)}>
              <PromptIcon tone={prompt.tone} />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold tracking-[-0.02em] text-white">{prompt.title}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200/88">{prompt.message}</p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:max-w-[320px] lg:justify-end">
          <Link
            href={prompt.primaryHref}
            className={cn(
              "inline-flex items-center gap-2 rounded-[14px] px-3.5 py-2 text-sm font-medium transition",
              styles.primary,
            )}
          >
            {prompt.primaryLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
          {prompt.secondaryHref && prompt.secondaryLabel ? (
            <Link
              href={prompt.secondaryHref}
              className={cn(
                "inline-flex items-center gap-2 rounded-[14px] border px-3.5 py-2 text-sm font-medium transition",
                styles.secondary,
              )}
            >
              {prompt.secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
