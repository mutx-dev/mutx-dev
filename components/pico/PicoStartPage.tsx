"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Rocket,
  ShieldCheck,
} from "lucide-react";

import { PicoProductShell } from "@/components/pico/PicoProductShell";
import { usePicoPath } from "@/components/pico/PicoPathProvider";
import { usePicoState } from "@/components/pico/usePicoState";
import { picoLessons } from "@/lib/pico/academy";

type StepStatus = "complete" | "pending" | "locked";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function extractError(payload: unknown, fallback: string) {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }

  if (!isRecord(payload)) {
    return fallback;
  }

  if (typeof payload.detail === "string" && payload.detail.trim().length > 0) {
    return payload.detail;
  }

  if (typeof payload.message === "string" && payload.message.trim().length > 0) {
    return payload.message;
  }

  if (isRecord(payload.error) && typeof payload.error.message === "string") {
    return payload.error.message;
  }

  return fallback;
}

function StepCard({
  title,
  description,
  detail,
  status,
  statusLabel,
  icon,
  primaryAction,
  secondaryAction,
}: {
  title: string;
  description: string;
  detail: string;
  status: StepStatus;
  statusLabel: string;
  icon: ReactNode;
  primaryAction: { href: string; label: string };
  secondaryAction?: { href: string; label: string };
}) {
  const toneClass =
    status === "complete"
      ? "border-emerald-300/20 bg-emerald-300/[0.06]"
      : status === "locked"
        ? "border-amber-300/20 bg-amber-300/[0.06]"
        : "border-white/10 bg-white/[0.03]";
  const badgeClass =
    status === "complete"
      ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
      : status === "locked"
        ? "border border-amber-300/20 bg-amber-300/10 text-amber-200"
        : "border border-white/10 bg-white/5 text-white/65";

  return (
    <section className={`rounded-[1.5rem] border p-6 ${toneClass}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#0a101b] text-cyan-100">
            {icon}
          </div>
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100/90">Checklist step</p>
            <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-white/68">{description}</p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${badgeClass}`}>
          {statusLabel}
        </span>
      </div>

      <p className="mt-4 text-sm text-white/55">{detail}</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Link
          href={primaryAction.href}
          className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
        >
          {primaryAction.label} <ArrowRight className="h-4 w-4" />
        </Link>
        {secondaryAction ? (
          <Link
            href={secondaryAction.href}
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            {secondaryAction.label}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

export function PicoStartPage() {
  const { state, loading, error } = usePicoState();
  const startHref = usePicoPath("/start");
  const academyHref = usePicoPath("/academy");
  const controlHref = usePicoPath("/control");
  const supportHref = usePicoPath("/support");
  const loginHref = usePicoPath("/login");
  const registerHref = usePicoPath("/register");
  const loginWithNextHref = `${loginHref}?${new URLSearchParams({ next: startHref }).toString()}`;
  const registerWithNextHref = `${registerHref}?${new URLSearchParams({ next: startHref }).toString()}`;
  const rawState = isRecord(state.raw) ? state.raw : null;
  const currentThreshold = typeof rawState?.cost_threshold_usd === "number" ? rawState.cost_threshold_usd : null;
  const approvalGateEnabled = rawState?.approval_gate_enabled === true;
  const nextLesson = useMemo(
    () => picoLessons.find((lesson) => !state.completedLessonSlugs.includes(lesson.slug)) ?? picoLessons[0],
    [state.completedLessonSlugs],
  );
  const nextLessonHref = usePicoPath(`/academy/${nextLesson.slug}`);
  const starterDeployHref = `${controlHref}#starter-deploy`;
  const controlReviewHref = `${controlHref}#control-review`;
  const [assistantState, setAssistantState] = useState<{
    loading: boolean;
    present: boolean;
    summary: string | null;
    error: string | null;
  }>({
    loading: false,
    present: false,
    summary: null,
    error: null,
  });

  useEffect(() => {
    if (!state.authenticated) {
      setAssistantState({ loading: false, present: false, summary: null, error: null });
      return;
    }

    let cancelled = false;

    async function loadAssistant() {
      setAssistantState((current) => ({ ...current, loading: true, error: null }));

      try {
        const response = await fetch("/api/dashboard/assistant/overview", { cache: "no-store" });
        const payload = await response.json().catch(() => null);

        if (cancelled) {
          return;
        }

        if (response.status === 401) {
          setAssistantState({ loading: false, present: false, summary: null, error: null });
          return;
        }

        if (!response.ok) {
          setAssistantState({
            loading: false,
            present: false,
            summary: null,
            error: extractError(payload, "Failed to inspect the current assistant runtime."),
          });
          return;
        }

        const runtime = isRecord(payload) && isRecord(payload.assistant) ? payload.assistant : null;
        const name = typeof runtime?.name === "string" ? runtime.name : "Starter assistant";
        const status = typeof runtime?.status === "string" ? runtime.status : "live";

        setAssistantState({
          loading: false,
          present: Boolean(runtime),
          summary: runtime ? `${name} · ${status}` : null,
          error: null,
        });
      } catch (requestError) {
        if (cancelled) {
          return;
        }

        setAssistantState({
          loading: false,
          present: false,
          summary: null,
          error:
            requestError instanceof Error
              ? requestError.message
              : "Failed to inspect the current assistant runtime.",
        });
      }
    }

    void loadAssistant();

    return () => {
      cancelled = true;
    };
  }, [state.authenticated]);

  const academyStarted = state.completedCount > 0;
  const controlReviewed = currentThreshold !== null || approvalGateEnabled;
  const completedSteps = [state.authenticated, academyStarted, assistantState.present, controlReviewed].filter(Boolean).length;

  return (
    <PicoProductShell
      title="Start"
      description="This is the shortest real path through Pico: create or sign into an operator account, record your first academy lesson, deploy the starter assistant from Control, then set one visible control before you trust it."
      actions={
        <>
          <Link
            href={nextLessonHref}
            className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            Open {academyStarted ? "next lesson" : "first lesson"} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={controlHref}
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            Open control
          </Link>
        </>
      }
    >
      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100/90">First-run checklist</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{completedSteps} of 4 steps complete</h2>
          <p className="mt-3 text-sm leading-7 text-white/68">
            Pico already ships the lesson corpus, the starter deploy path, and the live control surface. This route keeps the first pass in one place instead of scattering you across public pages.
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 text-sm leading-7 text-white/68">
          <p className="font-semibold text-white">What counts as done</p>
          <ul className="mt-4 space-y-3 text-white/60">
            <li>1. Auth is active for saved progress and same-origin control calls.</li>
            <li>2. At least one academy lesson is recorded complete.</li>
            <li>3. A starter assistant is visible in the assistant overview.</li>
            <li>4. A threshold or approval gate is set in Pico state.</li>
          </ul>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <StepCard
          title="Sign in or create an account"
          description="Use the hosted auth flow first. The academy is readable without auth, but saved progress, starter deploys, and Pico control state all depend on a real session."
          detail={
            state.authenticated
              ? "Session active. Continue with the first lesson so progress is recorded against the current operator account."
              : "No operator session yet. Open either auth route and return here when it finishes."
          }
          status={state.authenticated ? "complete" : "locked"}
          statusLabel={state.authenticated ? "Complete" : "Needs auth"}
          icon={state.authenticated ? <CheckCircle2 className="h-5 w-5" /> : <LockKeyhole className="h-5 w-5" />}
          primaryAction={{ href: state.authenticated ? nextLessonHref : loginWithNextHref, label: state.authenticated ? "Continue setup" : "Sign in" }}
          secondaryAction={{
            href: state.authenticated ? controlHref : registerWithNextHref,
            label: state.authenticated ? "Open control" : "Create account",
          }}
        />

        <StepCard
          title="Start the academy"
          description="Open the first incomplete lesson and treat the validation checklist as the finish line. The first recorded lesson is the cleanest proof that your Pico setup is real."
          detail={
            academyStarted
              ? `Progress recorded: ${state.completedCount} of ${picoLessons.length} lessons complete. Next up: ${nextLesson.title}.`
              : `No lessons recorded yet. Start with ${nextLesson.title} and only mark it done after the checks pass.`
          }
          status={academyStarted ? "complete" : "pending"}
          statusLabel={academyStarted ? "In motion" : "Not started"}
          icon={academyStarted ? <CheckCircle2 className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
          primaryAction={{ href: nextLessonHref, label: academyStarted ? "Continue lesson" : "Open first lesson" }}
          secondaryAction={{ href: academyHref, label: "Browse academy" }}
        />

        <StepCard
          title="Deploy the starter assistant"
          description="Use the real personal_assistant template deploy already wired into Control. This is the shipped bridge from lessons into a live monitored runtime."
          detail={
            assistantState.loading
              ? "Checking the current assistant overview now."
              : assistantState.present
                ? `Starter runtime detected: ${assistantState.summary}.`
                : state.authenticated
                  ? "No starter assistant is visible yet. Open the deploy form in Control and launch one runtime."
                  : "Sign in first so Control can read and write live operator state."
          }
          status={assistantState.present ? "complete" : state.authenticated ? "pending" : "locked"}
          statusLabel={
            assistantState.loading
              ? "Checking"
              : assistantState.present
                ? "Live"
                : state.authenticated
                  ? "Ready to deploy"
                  : "Needs auth"
          }
          icon={
            assistantState.loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : assistantState.present ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Rocket className="h-5 w-5" />
            )
          }
          primaryAction={{ href: starterDeployHref, label: "Open starter deploy" }}
          secondaryAction={assistantState.present ? { href: controlHref, label: "Review assistant" } : undefined}
        />

        <StepCard
          title="Review control before trusting the runtime"
          description="Set one threshold or create one pending approval. Pico does not pretend control exists until you touch a real guardrail."
          detail={
            controlReviewed
              ? `Control signals saved: threshold ${currentThreshold ?? "not set"}${approvalGateEnabled ? " and approval gate enabled" : ""}.`
              : state.authenticated
                ? "No visible guardrail is saved yet. Set a threshold or create one approval request from the Control page."
                : "Control review comes after auth because the guardrails write to the operator state service."
          }
          status={controlReviewed ? "complete" : state.authenticated ? "pending" : "locked"}
          statusLabel={controlReviewed ? "Reviewed" : state.authenticated ? "Pending" : "Needs auth"}
          icon={controlReviewed ? <CheckCircle2 className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          primaryAction={{ href: controlReviewHref, label: "Open control review" }}
          secondaryAction={state.authenticated ? { href: controlHref, label: "Open control" } : undefined}
        />
      </div>

      {error || assistantState.error ? (
        <section className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/[0.06] p-6 text-sm leading-7 text-amber-50">
          <p className="font-semibold">Live check note</p>
          <p className="mt-3">{error ?? assistantState.error}</p>
        </section>
      ) : null}

      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100/90">If you get stuck</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Use grounded support, not guesswork.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/68">
              Support only searches the shipped lesson corpus. It will point you back to concrete steps, validation checks, and troubleshooting notes instead of inventing new commands.
            </p>
          </div>
          <Link
            href={supportHref}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            Open support <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {!loading && completedSteps === 4 ? (
        <section className="rounded-[1.5rem] border border-emerald-300/20 bg-emerald-300/[0.06] p-6 text-sm leading-7 text-emerald-50">
          First run is in place. Stay in the academy for deeper lessons, use Control to monitor the live runtime, and return here anytime you want the shortest operator path back into Pico.
        </section>
      ) : null}
    </PicoProductShell>
  );
}