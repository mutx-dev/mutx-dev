"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, Loader2, Search } from "lucide-react";

import { PicoProductShell } from "@/components/pico/PicoProductShell";
import { usePicoBasePath } from "@/components/pico/PicoPathProvider";
import { usePicoState } from "@/components/pico/usePicoState";
import { picoLessons } from "@/lib/pico/course";
import { buildPicoPath } from "@/lib/pico/routing";

function tokenize(value: string) {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 2);
}

function scoreLesson(query: string, lesson: (typeof picoLessons)[number]) {
  const tokens = tokenize(query);
  const haystack = [
    lesson.title,
    lesson.summary,
    lesson.objective,
    lesson.deliverable,
    lesson.tags.join(" "),
    lesson.steps.map((step) => `${step.title} ${step.body} ${step.expected ?? ""}`).join(" "),
    lesson.troubleshooting.map((item) => `${item.symptom} ${item.cause} ${item.fix}`).join(" "),
    lesson.validation.checklist.join(" "),
    lesson.support.escalation,
  ]
    .join(" ")
    .toLowerCase();

  return tokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
}

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

export function findPicoSupportMatches(query: string) {
  if (!query.trim()) {
    return [];
  }

  return picoLessons
    .map((lesson) => ({ lesson, score: scoreLesson(query, lesson) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);
}

export function PicoSupportPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const basePath = usePicoBasePath();
  const loginHref = buildPicoPath(basePath, "/login");
  const { state, loading, error, refresh } = usePicoState();
  const matches = useMemo(() => findPicoSupportMatches(submittedQuery), [submittedQuery]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setSubmitError("Describe the issue before using a tutor lookup.");
      return;
    }

    if (!state.authenticated) {
      setSubmitError("Sign in to use grounded tutor lookups tied to your Pico plan.");
      return;
    }

    if (state.tutorAccess.limitReached) {
      setSubmitError(state.tutorAccess.note ?? "Your grounded tutor limit has been reached.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSessionMessage(null);

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
          },
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(extractErrorMessage(payload, "Failed to record grounded tutor usage."));
      }

      setSubmittedQuery(trimmedQuery);
      setSessionMessage("Grounded tutor lookup recorded. Results below are limited to the existing Pico lesson corpus.");
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
    <PicoProductShell
      title="Support"
      description="Grounded tutor guidance only. This page searches the Pico lesson corpus and points back to the exact tutorial, validation rule, or troubleshooting note that matches your issue."
    >
      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <form onSubmit={handleSubmit} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
          <label className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100/90" htmlFor="pico-support-query">
            Describe the problem you are hitting
          </label>
          <div className="mt-4 flex flex-col gap-3 lg:flex-row">
            <div className="flex-1 rounded-[1.25rem] border border-white/10 bg-[#0a101b] px-4 py-3">
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
              className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/45"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Use 1 grounded tutor lookup
            </button>
          </div>
          <p className="mt-4 text-sm leading-7 text-white/55">
            The tutor will not invent new commands. It only surfaces content that already exists inside the 12 Pico lessons. Each search now spends one tracked tutor lookup so the product can enforce simple plan limits honestly.
          </p>
          {sessionMessage ? <p className="mt-4 text-sm text-emerald-200">{sessionMessage}</p> : null}
          {submitError ? <p className="mt-4 text-sm text-amber-200">{submitError}</p> : null}
          {error ? <p className="mt-4 text-sm text-white/55">Progress refresh: {error}</p> : null}
        </form>

        <aside className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100/90">Tutor access</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {state.plan ?? "Sign in to load your plan"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-white/65">
            {state.tutorAccess.note ?? "Tutor lookups are plan-gated once you sign in."}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-[#0a101b] px-4 py-3">
              <p className="text-white/45">Used</p>
              <p className="mt-1 text-xl font-semibold text-white">{state.tutorSessionsUsed}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0a101b] px-4 py-3">
              <p className="text-white/45">Remaining</p>
              <p className="mt-1 text-xl font-semibold text-white">{state.tutorAccess.remaining ?? "∞"}</p>
            </div>
          </div>
          {state.authenticated ? null : (
            <div className="mt-4 rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] p-4 text-sm text-amber-50">
              Sign in before you can spend a grounded tutor lookup.
              <div className="mt-3">
                <Link href={loginHref} className="font-semibold text-white">
                  Go to sign in
                </Link>
              </div>
            </div>
          )}
          {state.tutorAccess.limitReached ? (
            <div className="mt-4 rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] p-4 text-sm text-amber-50">
              You have hit the current tutor limit for this plan. Upgrade the plan flag or keep using the academy directly until reset windows exist.
            </div>
          ) : null}
        </aside>
      </section>

      {submittedQuery.trim().length === 0 ? (
        <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 text-sm leading-7 text-white/65">
          Try asking about scope, prompts, test runs, alerts, approvals, runtime, budgets, or bad runs. Starter prompts:
          <ul className="mt-3 list-disc space-y-2 pl-5 text-white/60">
            <li>My agent keeps acting without enough evidence.</li>
            <li>How do I know whether the runtime or the prompt is failing?</li>
            <li>What should require approval before launch?</li>
          </ul>
        </section>
      ) : null}

      {submittedQuery.trim().length > 0 && matches.length === 0 ? (
        <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 text-sm leading-7 text-white/65">
          No direct match was found in the lesson corpus for “{submittedQuery}”. Reword the symptom using the exact failure you can see: scope, approval queue, alerts, runtime, prompt drift, threshold, or bad run.
        </section>
      ) : null}

      <div className="space-y-5">
        {matches.map(({ lesson, score }) => {
          const lessonHref = buildPicoPath(basePath, `/academy/${lesson.slug}`);
          return (
            <section key={lesson.slug} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100/90">Match score {score}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">{lesson.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-white/68">{lesson.summary}</p>
                </div>
                <Link href={lessonHref} className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950">
                  Open lesson <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-3">
                <div className="rounded-[1.25rem] border border-white/10 bg-[#0a101b] p-4">
                  <p className="text-sm font-semibold text-white">Do this now</p>
                  <ul className="mt-3 space-y-3 text-sm leading-7 text-white/65">
                    {lesson.steps.slice(0, 2).map((step) => (
                      <li key={step.title}>
                        <span className="font-semibold text-white">{step.title}:</span> {step.body}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-[#0a101b] p-4">
                  <p className="text-sm font-semibold text-white">Validate before moving on</p>
                  <ul className="mt-3 space-y-3 text-sm leading-7 text-white/65">
                    {lesson.validation.checklist.slice(0, 3).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-[#0a101b] p-4">
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
  );
}
