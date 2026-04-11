"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, ArrowRight, Clock3, RotateCcw } from "lucide-react";

import { LivePanel, formatRelativeTime } from "@/components/dashboard/livePrimitives";
import { dashboardTokens } from "@/components/dashboard/tokens";
import {
  getResumeVisit,
  hasCheckedToday,
  markDashboardChecked,
  readDashboardReturnState,
  type DashboardReturnState,
} from "@/components/dashboard/returnLoopState";

import type { components } from "@/app/types/api";

type Alert = components["schemas"]["AlertResponse"];
type Run = components["schemas"]["RunResponse"];

type ActionTone = "info" | "warning" | "danger";

type ActionCard = {
  eyebrow: string;
  title: string;
  detail: string;
  href: string;
  ctaLabel: string;
  tone: ActionTone;
  icon: typeof RotateCcw;
};

function getTimestamp(value?: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function getRunActivityTimestamp(run: Run) {
  return (
    getTimestamp(run.completed_at) ??
    getTimestamp(run.started_at) ??
    getTimestamp(run.created_at)
  );
}

function getDayStartTimestamp(reference = new Date()) {
  return new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
    0,
    0,
    0,
    0,
  ).getTime();
}

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

function cardToneClasses(tone: ActionTone) {
  switch (tone) {
    case "danger":
      return {
        border: "border-rose-400/28",
        badge: "border-rose-400/20 bg-rose-400/12 text-rose-100",
        button: "border-rose-400/24 bg-rose-400/10 text-rose-100 hover:bg-rose-400/14",
        icon: "text-rose-200",
      };
    case "warning":
      return {
        border: "border-amber-300/28",
        badge: "border-amber-300/20 bg-amber-300/12 text-amber-100",
        button: "border-amber-300/24 bg-amber-300/10 text-amber-100 hover:bg-amber-300/14",
        icon: "text-amber-200",
      };
    default:
      return {
        border: "border-cyan-400/20",
        badge: "border-cyan-400/20 bg-cyan-400/10 text-cyan-100",
        button: "border-cyan-400/24 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/14",
        icon: "text-cyan-200",
      };
  }
}

function ActionSignalCard({ card }: { card: ActionCard }) {
  const tone = cardToneClasses(card.tone);
  const Icon = card.icon;

  return (
    <article
      className={`rounded-[20px] border bg-white/[0.03] p-4 ${tone.border}`}
      style={{ boxShadow: dashboardTokens.shadowSm }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${tone.badge}`}>
            {card.eyebrow}
          </span>
          <h3 className="mt-3 text-lg font-semibold tracking-[-0.04em] text-white">{card.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{card.detail}</p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-white/10 bg-black/20 ${tone.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <Link
        href={card.href}
        className={`mt-4 inline-flex items-center gap-2 rounded-[12px] border px-3.5 py-2 text-sm font-medium transition ${tone.button}`}
      >
        {card.ctaLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

export function ReturnLoopPanel({
  runs,
  alerts,
  liveAgentCount,
}: {
  runs: Run[];
  alerts: Alert[];
  liveAgentCount: number;
}) {
  const [returnState, setReturnState] = useState<DashboardReturnState | null>(null);

  useEffect(() => {
    const stored = readDashboardReturnState();
    setReturnState(stored);
    markDashboardChecked();
  }, []);

  const cards = useMemo(() => {
    const now = new Date();
    const resumeVisit = getResumeVisit(returnState?.visits ?? [], "/dashboard");
    const checkedToday = hasCheckedToday(returnState?.lastCheckedAt ?? null, now);
    const lastCheckedTimestamp = getTimestamp(returnState?.lastCheckedAt) ?? getDayStartTimestamp(now);
    const runsSinceLastCheck = runs.filter((run) => {
      const timestamp = getRunActivityTimestamp(run);
      return timestamp !== null && timestamp > lastCheckedTimestamp;
    });
    const runsToday = runs.filter((run) => {
      const timestamp = getRunActivityTimestamp(run);
      return timestamp !== null && timestamp >= getDayStartTimestamp(now);
    });
    const failedRunsSinceLastCheck = runsSinceLastCheck.filter((run) => run.status === "failed");
    const unresolvedAlerts = alerts.filter((alert) => !alert.resolved);
    const openAlertsSinceLastCheck = unresolvedAlerts.filter((alert) => {
      const timestamp = getTimestamp(alert.created_at);
      return timestamp !== null && timestamp > lastCheckedTimestamp;
    });
    const failureCount = failedRunsSinceLastCheck.length + openAlertsSinceLastCheck.length;
    const latestFailure =
      openAlertsSinceLastCheck[0]?.message ??
      unresolvedAlerts[0]?.message ??
      failedRunsSinceLastCheck[0]?.error_message ??
      null;
    const activityWindowLabel = returnState?.lastCheckedAt
      ? `since ${formatRelativeTime(returnState.lastCheckedAt)}`
      : "today";

    const nextAction: ActionCard = failureCount > 0
      ? {
          eyebrow: "Next action",
          title: "Something failed",
          detail: latestFailure
            ? `${failureCount} ${pluralize(failureCount, "signal")} need attention. Latest: ${latestFailure}`
            : `${failureCount} ${pluralize(failureCount, "failure")} landed while you were away.`,
          href: "/dashboard/monitoring",
          ctaLabel: "Open monitoring",
          tone: "danger",
          icon: AlertTriangle,
        }
      : resumeVisit
        ? {
            eyebrow: "Next action",
            title: `Pick up ${resumeVisit.title}`,
            detail: `Go straight back to where you left off ${formatRelativeTime(resumeVisit.visitedAt)}.${resumeVisit.context ? ` Last thing: ${resumeVisit.context}.` : ""}`,
            href: resumeVisit.href,
            ctaLabel: `Resume ${resumeVisit.title}`,
            tone: "info",
            icon: RotateCcw,
          }
        : runsToday.length > 0
          ? {
              eyebrow: "Next action",
              title: "Review today's execution",
              detail: `Your agent ran ${runsToday.length} ${pluralize(runsToday.length, "time")} today. Close the loop before drift piles up.`,
              href: "/dashboard/runs",
              ctaLabel: "Open run history",
              tone: "info",
              icon: Activity,
            }
          : {
              eyebrow: "Next action",
              title: liveAgentCount > 0 ? "Check live sessions" : "Open agent registry",
              detail: liveAgentCount > 0
                ? "Your fleet is live. Make sure the session surface still matches reality."
                : "No sticky trail yet. Start in the registry so the product has something worth coming back to.",
              href: liveAgentCount > 0 ? "/dashboard/sessions" : "/dashboard/agents",
              ctaLabel: liveAgentCount > 0 ? "Inspect sessions" : "Open agents",
              tone: "info",
              icon: Activity,
            };

    const resumeCard: ActionCard = resumeVisit
      ? {
          eyebrow: "Resume session",
          title: resumeVisit.title,
          detail: `Last thing you were doing ${formatRelativeTime(resumeVisit.visitedAt)}.${resumeVisit.context ? ` Context: ${resumeVisit.context}.` : ` ${resumeVisit.description}.`}`,
          href: resumeVisit.href,
          ctaLabel: `Resume ${resumeVisit.title}`,
          tone: "info",
          icon: Clock3,
        }
      : {
          eyebrow: "Resume session",
          title: "No work trail yet",
          detail: "As soon as you move past overview, MUTX pins the exact surface so the next visit starts in motion instead of from scratch.",
          href: "/dashboard/agents",
          ctaLabel: "Create the trail",
          tone: "info",
          icon: Clock3,
        };

    const activityCard: ActionCard = failureCount > 0
      ? {
          eyebrow: "Activity",
          title: runsSinceLastCheck.length > 0
            ? `Your agent ran ${runsSinceLastCheck.length} ${pluralize(runsSinceLastCheck.length, "time")}`
            : "Something changed while you were away",
          detail: `${failureCount} ${pluralize(failureCount, "signal")} broke ${activityWindowLabel}.${latestFailure ? ` ${latestFailure}` : ""}`,
          href: "/dashboard/runs",
          ctaLabel: "Review activity",
          tone: "warning",
          icon: Activity,
        }
      : runsSinceLastCheck.length > 0
        ? {
            eyebrow: "Activity",
            title: `Your agent ran ${runsSinceLastCheck.length} ${pluralize(runsSinceLastCheck.length, "time")}`,
            detail: `Fresh execution landed ${activityWindowLabel}. The product moved even when you were gone.`,
            href: "/dashboard/runs",
            ctaLabel: "See recent runs",
            tone: "info",
            icon: Activity,
          }
        : {
            eyebrow: "Activity",
            title: checkedToday ? "Quiet since your last check" : "No runs yet today",
            detail: checkedToday
              ? "Nothing new fired after your last visit. Good. That means the next change will stand out immediately."
              : "Open once a day and the first new run or failure becomes obvious instead of buried.",
            href: "/dashboard/runs",
            ctaLabel: "Open runs",
            tone: "info",
            icon: Activity,
          };

    const urgencyCard: ActionCard = !checkedToday
      ? {
          eyebrow: "Daily pulse",
          title: "You have not checked your agent today",
          detail: failureCount > 0
            ? `${failureCount} ${pluralize(failureCount, "signal")} already need attention.`
            : runsToday.length > 0
              ? `${runsToday.length} ${pluralize(runsToday.length, "run")} landed today. Don't let them disappear into the pile.`
              : "Even when the graph looks quiet, today is when drift sneaks in wearing slippers.",
          href: failureCount > 0 ? "/dashboard/monitoring" : "/dashboard",
          ctaLabel: "Check now",
          tone: failureCount > 0 ? "danger" : "warning",
          icon: AlertTriangle,
        }
      : failureCount > 0
        ? {
            eyebrow: "Daily pulse",
            title: "Something failed while you were away",
            detail: latestFailure ?? "The run surface is telling you to look closer.",
            href: "/dashboard/monitoring",
            ctaLabel: "Inspect failure",
            tone: "danger",
            icon: AlertTriangle,
          }
        : {
            eyebrow: "Daily pulse",
            title: runsSinceLastCheck.length > 0 ? "The product kept moving" : "You are caught up",
            detail: runsSinceLastCheck.length > 0
              ? `New execution landed ${activityWindowLabel}. The home surface is doing its job.`
              : "No hidden fires right now. When something changes, this panel becomes the tripwire.",
            href: runsSinceLastCheck.length > 0 ? "/dashboard/runs" : "/dashboard/monitoring",
            ctaLabel: runsSinceLastCheck.length > 0 ? "Open changes" : "Open monitoring",
            tone: "info",
            icon: AlertTriangle,
          };

    return [nextAction, resumeCard, activityCard, urgencyCard];
  }, [alerts, liveAgentCount, returnState, runs]);

  return (
    <LivePanel title="Return loop" meta="why come back">
      <div className="grid gap-3 xl:grid-cols-2">
        {cards.map((card) => (
          <ActionSignalCard key={`${card.eyebrow}-${card.title}`} card={card} />
        ))}
      </div>
    </LivePanel>
  );
}
