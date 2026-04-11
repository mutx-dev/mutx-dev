"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";
import { ArrowRight, Loader2, Search } from "lucide-react";

import { PicoContactForm, type PicoContactInterest } from "@/components/pico/PicoContactForm";
import { PicoProductShell } from "@/components/pico/PicoProductShell";
import { usePicoBasePath } from "@/components/pico/PicoPathProvider";
import {
  picoPrimaryButtonClass,
  picoSecondaryButtonClass,
  picoSectionLabelClass,
  picoSurfaceClass,
  picoSurfaceInsetClass,
} from "@/components/pico/picoUi";
import { usePicoState } from "@/components/pico/usePicoState";
import { buildPicoPath } from "@/lib/pico/routing";
import { findPicoSupportMatches } from "@/lib/pico/tutor";

function extractErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (typeof record.detail === "string") {
      return record.detail;
    }
    if (typeof record.message === "string") {
      return record.message;
    }
    if (record.error && typeof record.error === "object") {
      const nested = record.error as Record<string, unknown>;
      if (typeof nested.message === "string") {
        return nested.message;
      }
    }
  }

  return fallback;
}

function buildEscalationMessage(query: string, lessonTitle?: string) {
  const trimmed = query.trim();
  if (!trimmed) {
    return "I am blocked in PicoMUTX and need help unblocking the next step.\n\nWhat I tried:\n- \n\nWhat happened:\n- \n\nWhat I expected:\n- ";
  }

  return [
    "I am blocked in PicoMUTX and need help with the next concrete step.",
    "",
    `Problem: ${trimmed}`,
    lessonTitle ? `Closest lesson match: ${lessonTitle}` : null,
    "",
    "What I tried:",
    "- ",
    "",
    "What happened:",
    "- ",
    "",
    "What I expected:",
    "- ",
  ]
    .filter(Boolean)
    .join("\n");
}

export function PicoSupportPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactSource, setContactSource] = useState("pico-support");
  const [contactInterest, setContactInterest] = useState<PicoContactInterest>("fixing-existing");
  const [contactMessage, setContactMessage] = useState("");
  const basePath = usePicoBasePath();
  const loginHref = buildPicoPath(basePath, "/login");
  const { state, loading, error, refresh } = usePicoState();
  const previewQuery = query.trim().length > 0 ? query : submittedQuery;
  const matches = useMemo(() => findPicoSupportMatches(previewQuery), [previewQuery]);

  function openEscalation(source: string, interest: PicoContactInterest, message: string) {
    setContactSource(source);
    setContactInterest(interest);
    setContactMessage(message);
    setContactOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setSubmitError("Describe the issue before using the tutor lane.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSessionMessage(null);
    setSubmittedQuery(trimmedQuery);

    if (!state.authenticated) {
      setSessionMessage("Previewing local lesson matches only. Sign in if you want tutor usage tracked and synced to your Pico state.");
      setSubmitting(false);
      return;
    }

    if (state.tutorAccess.limitReached) {
      setSubmitError(state.tutorAccess.note ?? "Your grounded tutor limit has been reached.");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/pico/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "tutor_session_used",
          tutor_sessions: 1,
          metadata: {
            source: "pico-support",
            query: trimmedQuery,
            preview_match_count: matches.length,
          },
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(extractErrorMessage(payload, "Failed to record grounded tutor usage."));
      }

      setSessionMessage("Grounded tutor lookup recorded. The results below stay pinned to the shipped Pico lesson corpus.");
      await refresh();
    } catch (requestError) {
      setSubmitError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to record grounded tutor usage.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PicoContactForm
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        defaultInterest={contactInterest}
        defaultMessage={contactMessage}
        source={contactSource}
      />
      <PicoProductShell
        title="Support"
        description="Grounded help first, human escalation when needed. This page previews the Pico lesson corpus immediately, then records tutor usage only when you want that interaction tied back to your Pico state."
      >
        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <form onSubmit={handleSubmit} className={`${picoSurfaceClass} p-6`}>
            <label className={picoSectionLabelClass} htmlFor="pico-support-query">
              Describe the problem you are hitting
            </label>
            <div className="mt-4 flex flex-col gap-3 lg:flex-row">
              <div className={`${picoSurfaceInsetClass} flex-1 px-4 py-3`}>
                <div className="flex items-center gap-3">
                  <Search className="h-4 w-4 text-white/45" />
                  <input
                    id="pico-support-query"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Examples: alerts keep firing, approval queue is stuck, prompt is improvising"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting || loading}
                className={`${picoPrimaryButtonClass} px-5 py-3 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/45`}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {state.authenticated ? "Save tutor lookup" : "Preview local matches"}
              </button>
            </div>
            <p className="mt-4 text-sm leading-7 text-white/55">
              You should not burn effort before seeing a result. Pico now previews lesson matches from the local corpus first. Sign in only matters when you want usage, limits, and support history tied back to your actual operator state.
            </p>
            {sessionMessage ? <p className="mt-4 text-sm text-emerald-200">{sessionMessage}</p> : null}
            {submitError ? <p className="mt-4 text-sm text-amber-200">{submitError}</p> : null}
            {error ? <p className="mt-4 text-sm text-white/55">Progress refresh: {error}</p> : null}
          </form>

          <aside className={`${picoSurfaceClass} p-6`}>
            <p className={picoSectionLabelClass}>Tutor access</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              {state.plan ?? "Local preview mode"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/65">
              {state.authenticated
                ? state.tutorAccess.note ?? "Tutor usage is tied to your Pico plan when you are signed in."
                : "You can inspect local matches right now. Sign in only when you want tutor usage and limits tracked against your plan."}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className={`${picoSurfaceInsetClass} px-4 py-3`}>
                <p className="text-white/45">Used</p>
                <p className="mt-1 text-xl font-semibold text-white">{state.tutorSessionsUsed}</p>
              </div>
              <div className={`${picoSurfaceInsetClass} px-4 py-3`}>
                <p className="text-white/45">Remaining</p>
                <p className="mt-1 text-xl font-semibold text-white">{state.tutorAccess.remaining ?? "∞"}</p>
              </div>
            </div>
            {state.authenticated ? null : (
              <div className="mt-4 rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] p-4 text-sm text-amber-50">
                Preview first. Sign in only if you want the tutor lane tracked and synced.
                <div className="mt-3">
                  <Link href={loginHref} className="font-semibold text-white">
                    Go to sign in
                  </Link>
                </div>
              </div>
            )}
            {state.tutorAccess.limitReached ? (
              <div className="mt-4 rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] p-4 text-sm text-amber-50">
                You hit the current tutor limit for this plan. Keep working directly from the lesson corpus or escalate to a human with the exact failure context.
              </div>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  openEscalation(
                    "pico-support",
                    "fixing-existing",
                    buildEscalationMessage(previewQuery, matches[0]?.lesson.title),
                  )
                }
                className={picoSecondaryButtonClass}
              >
                Escalate to human
              </button>
              <button
                type="button"
                onClick={() =>
                  openEscalation(
                    "pico-office-hours",
                    "other",
                    buildEscalationMessage(previewQuery, matches[0]?.lesson.title),
                  )
                }
                className={picoSecondaryButtonClass}
              >
                Request office hours
              </button>
            </div>
          </aside>
        </section>

        {previewQuery.trim().length === 0 ? (
          <section className={`${picoSurfaceClass} p-6 text-sm leading-7 text-white/65`}>
            Try asking about scope, prompts, test runs, alerts, approvals, runtime, budgets, or bad runs. Starter prompts:
            <ul className="mt-3 list-disc space-y-2 pl-5 text-white/60">
              <li>My agent keeps acting without enough evidence.</li>
              <li>How do I know whether the runtime or the prompt is failing?</li>
              <li>What should require approval before launch?</li>
            </ul>
          </section>
        ) : null}

        {previewQuery.trim().length > 0 && matches.length === 0 ? (
          <section className={`${picoSurfaceClass} p-6 text-sm leading-7 text-white/65`}>
            No direct lesson match yet for “{previewQuery}”. That usually means the symptom is too vague. Rewrite it using the exact failure you can see, or escalate with the context prefilled.
            <div className="mt-4">
              <button
                type="button"
                onClick={() => openEscalation("pico-support", "fixing-existing", buildEscalationMessage(previewQuery))}
                className={picoSecondaryButtonClass}
              >
                Escalate with this context
              </button>
            </div>
          </section>
        ) : null}

        <div className="space-y-5">
          {matches.map(({ lesson, score }) => {
            const lessonHref = buildPicoPath(basePath, `/academy/${lesson.slug}`);
            return (
              <section key={lesson.slug} className={`${picoSurfaceClass} p-6`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className={picoSectionLabelClass}>Match score {score}</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">{lesson.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-white/68">{lesson.summary}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link href={lessonHref} className={picoPrimaryButtonClass}>
                      Open lesson <ArrowRight className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() =>
                        openEscalation(
                          "pico-support",
                          "fixing-existing",
                          buildEscalationMessage(previewQuery, lesson.title),
                        )
                      }
                      className={picoSecondaryButtonClass}
                    >
                      Escalate with context
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-3">
                  <div className={`${picoSurfaceInsetClass} p-4`}>
                    <p className="text-sm font-semibold text-white">Do this now</p>
                    <ul className="mt-3 space-y-3 text-sm leading-7 text-white/65">
                      {lesson.steps.slice(0, 2).map((step) => (
                        <li key={step.title}>
                          <span className="font-semibold text-white">{step.title}:</span> {step.body}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={`${picoSurfaceInsetClass} p-4`}>
                    <p className="text-sm font-semibold text-white">Validate before moving on</p>
                    <ul className="mt-3 space-y-3 text-sm leading-7 text-white/65">
                      {lesson.validation.checklist.slice(0, 3).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className={`${picoSurfaceInsetClass} p-4`}>
                    <p className="text-sm font-semibold text-white">If it still fails</p>
                    <ul className="mt-3 space-y-3 text-sm leading-7 text-white/65">
                      {lesson.troubleshooting.slice(0, 2).map((item) => (
                        <li key={item.symptom}>
                          <span className="font-semibold text-white">{item.symptom}:</span> {item.fix}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <p className="mt-4 text-sm text-white/50">Escalate when: {lesson.support.escalation}</p>
              </section>
            );
          })}
        </div>
      </PicoProductShell>
    </>
  );
}
