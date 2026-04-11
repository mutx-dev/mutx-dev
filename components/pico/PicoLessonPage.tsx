"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, CircleDashed, Loader2 } from "lucide-react";

import { PicoProductShell } from "@/components/pico/PicoProductShell";
import { usePicoBasePath } from "@/components/pico/PicoPathProvider";
import { usePicoState } from "@/components/pico/usePicoState";
import { getNextPicoLesson, picoLevels, picoTracks, type PicoLesson } from "@/lib/pico/academy";
import { buildPicoPath } from "@/lib/pico/routing";

type PicoLessonPageProps = {
  lesson: PicoLesson;
};

function extractErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (typeof record.detail === "string") {
      return record.detail;
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

export function PicoLessonPage({ lesson }: PicoLessonPageProps) {
  const basePath = usePicoBasePath();
  const academyHref = buildPicoPath(basePath, "/academy");
  const supportHref = `${buildPicoPath(basePath, "/support")}?q=${encodeURIComponent(lesson.support.prompt)}`;
  const startHref = buildPicoPath(basePath, "/start");
  const nextLesson = getNextPicoLesson(lesson.slug);
  const { state, loading, error, refresh, markCompleted } = usePicoState();
  const completed = state.completedLessonSlugs.includes(lesson.slug);
  const level = useMemo(() => picoLevels.find((item) => item.id === lesson.levelId), [lesson.levelId]);
  const track = useMemo(() => picoTracks.find((item) => item.id === lesson.trackId), [lesson.trackId]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  async function handleComplete() {
    setSubmitting(true);
    setSubmitError(null);
    setConfirmation(null);

    try {
      const response = await fetch("/api/pico/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "lesson_completed",
          lesson_id: lesson.slug,
          track_id: lesson.trackId,
          metadata: {
            level_id: lesson.levelId,
            completed_at: new Date().toISOString(),
            source: "pico-academy",
          },
        }),
      });

      const payload = await response.json().catch(() => null);
      if (response.status === 401) {
        throw new Error("Sign in to record lesson completion.");
      }

      if (!response.ok) {
        throw new Error(extractErrorMessage(payload, "Failed to record completion."));
      }

      markCompleted(lesson.slug);
      setConfirmation("Completion recorded. The academy progress bar should reflect this lesson now.");
      await refresh();
    } catch (requestError) {
      setSubmitError(
        requestError instanceof Error ? requestError.message : "Failed to record completion.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PicoProductShell
      title={lesson.title}
      description={`${lesson.summary} Deliverable: ${lesson.deliverable}`}
      actions={
        <>
          <Link href={academyHref} className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/80">
            Back to academy
          </Link>
          {nextLesson ? (
            <Link href={buildPicoPath(basePath, `/academy/${nextLesson.slug}`)} className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950">
              Next lesson
            </Link>
          ) : null}
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
              <span>{level?.title}</span>
              <span>•</span>
              <span>{track?.title}</span>
              <span>•</span>
              <span>{lesson.durationMinutes} min</span>
            </div>
            <p className="mt-4 text-sm leading-7 text-white/70">{lesson.objective}</p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100/90">Steps</p>
            <div className="mt-5 space-y-4">
              {lesson.steps.map((step, index) => (
                <div key={step.title} className="rounded-[1.25rem] border border-white/10 bg-[#0a101b] p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-sm font-semibold text-cyan-100">
                      {index + 1}
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-lg font-semibold text-white">{step.title}</h2>
                      <p className="text-sm leading-7 text-white/68">{step.body}</p>
                      {step.command ? (
                        <pre className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-cyan-100">{step.command}</pre>
                      ) : null}
                      {step.expected ? (
                        <p className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.06] px-4 py-3 text-sm text-emerald-100">
                          Expected signal: {step.expected}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100/90">Validation</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-white/68">
              {lesson.validation.checklist.map((item) => (
                <li key={item} className="flex gap-3">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-200" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] px-4 py-3 text-sm text-cyan-50">
              Done looks like: {lesson.validation.doneLooksLike}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-100/90">Troubleshooting</p>
            <div className="mt-4 space-y-3">
              {lesson.troubleshooting.map((item) => (
                <div key={item.symptom} className="rounded-[1.25rem] border border-white/10 bg-[#0a101b] p-4">
                  <p className="text-sm font-semibold text-white">{item.symptom}</p>
                  <p className="mt-2 text-sm leading-6 text-white/60">Cause: {item.cause}</p>
                  <p className="mt-2 text-sm leading-6 text-cyan-50">Fix: {item.fix}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/60">Completion</p>
            <div className="mt-4 flex items-center gap-3 text-sm text-white/70">
              {completed ? <CheckCircle2 className="h-5 w-5 text-emerald-200" /> : <CircleDashed className="h-5 w-5 text-white/40" />}
              <span>{completed ? "This lesson is already marked complete." : "Mark this complete only after the validation checks pass."}</span>
            </div>
            {!state.authenticated && !loading ? (
              <div className="mt-4 rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] p-4 text-sm text-amber-50">
                Open Pico start to sign in, keep academy progress synced, and follow the first-run checklist in one place.
                <div className="mt-3">
                  <Link href={startHref} className="font-semibold text-white">Open Pico start</Link>
                </div>
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => void handleComplete()}
              disabled={submitting || completed}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/45"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {completed ? "Completion recorded" : "Record completion"}
            </button>
            {confirmation ? <p className="mt-4 text-sm text-emerald-200">{confirmation}</p> : null}
            {submitError ? <p className="mt-4 text-sm text-amber-200">{submitError}</p> : null}
            {error ? <p className="mt-4 text-sm text-white/50">Progress refresh: {error}</p> : null}
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100/90">Need help?</p>
            <p className="mt-3 text-sm leading-7 text-white/68">The support page only searches this lesson corpus. Start with the exact issue you see and it will point you back to specific steps, validation checks, and troubleshooting notes.</p>
            <Link href={supportHref} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100">
              Open grounded support <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-sm text-white/45">
              Tutor lookups remaining: {state.tutorAccess.remaining ?? "∞"}
              {state.tutorAccess.limit === null ? " for the current plan flag." : ` of ${state.tutorAccess.limit}.`}
            </p>
            <p className="mt-3 text-sm text-white/45">Escalate when: {lesson.support.escalation}</p>
          </div>
        </aside>
      </div>
    </PicoProductShell>
  );
}
