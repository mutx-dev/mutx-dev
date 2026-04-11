"use client";

import Link from "next/link";
import { ArrowRight, LockKeyhole, RefreshCw } from "lucide-react";

import { PicoProductShell } from "@/components/pico/PicoProductShell";
import { usePicoBasePath } from "@/components/pico/PicoPathProvider";
import { usePicoState } from "@/components/pico/usePicoState";
import {
  getPicoLessonsByLevel,
  getPicoLessonsByTrack,
  picoLevels,
  picoLessons,
  picoTracks,
} from "@/lib/pico/course";
import { buildPicoPath } from "@/lib/pico/routing";

export function PicoAcademyPage() {
  const basePath = usePicoBasePath();
  const { state, loading, error, refresh } = usePicoState();
  const academyHref = buildPicoPath(basePath, "/academy");
  const loginHref = buildPicoPath(basePath, "/login");
  const registerHref = buildPicoPath(basePath, "/register");
  const nextLesson = picoLessons.find((lesson) => !state.completedLessonSlugs.includes(lesson.slug)) ?? picoLessons[0];
  const nextLessonHref = buildPicoPath(basePath, `/academy/${nextLesson.slug}`);

  return (
    <PicoProductShell
      title="Academy"
      description="Twelve concrete tutorials, organized by level and track, to help a small team scope, launch, and operate one real AI workflow without pretending the hard parts disappear."
      actions={
        <>
          <Link
            href={nextLessonHref}
            className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            Continue {nextLesson.title} <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh progress
          </button>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100/90">Progress</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Move one lesson at a time.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">
                Progress is loaded from /api/pico/state when you are signed in. Completion is recorded from each lesson page through /api/pico/events.
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/70">Completion</p>
              <p className="mt-1 text-3xl font-semibold text-white">{state.percentComplete}%</p>
              <p className="text-sm text-white/60">{state.completedCount} of {picoLessons.length} tutorials done</p>
            </div>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${state.percentComplete}%` }} />
          </div>
          {error ? <p className="mt-4 text-sm text-amber-200">{error}</p> : null}
        </section>

        <aside className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6">
          {state.authenticated ? (
            <>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-200">Signed in</p>
              <p className="mt-2 text-lg font-semibold text-white">Your completion will sync across the academy.</p>
              <p className="mt-2 text-sm leading-7 text-white/65">Open the next incomplete lesson, run the validation checklist, and use the completion button when the workflow is truly ready.</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-white/10 bg-[#0a101b] px-4 py-3">
                  <p className="text-white/45">Level</p>
                  <p className="mt-1 text-xl font-semibold text-white">{typeof (state.raw as { current_level?: unknown } | null)?.current_level === 'number' ? (state.raw as { current_level: number }).current_level : 1}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0a101b] px-4 py-3">
                  <p className="text-white/45">XP</p>
                  <p className="mt-1 text-xl font-semibold text-white">{typeof (state.raw as { xp_total?: unknown } | null)?.xp_total === 'number' ? (state.raw as { xp_total: number }).xp_total : 0}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 p-2 text-amber-200">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <p className="mt-3 text-lg font-semibold text-white">Sign in to save lesson progress.</p>
              <p className="mt-2 text-sm leading-7 text-white/65">The academy content is open, but progress and completion tracking need an authenticated session.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href={loginHref} className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950">Sign in</Link>
                <Link href={registerHref} className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/85">Create account</Link>
              </div>
            </>
          )}
        </aside>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        {picoLevels.map((level) => {
          const lessons = getPicoLessonsByLevel(level.id);
          const completed = lessons.filter((lesson) => state.completedLessonSlugs.includes(lesson.slug)).length;

          return (
            <div key={level.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm font-semibold text-cyan-100">{level.title}</p>
              <p className="mt-3 text-sm leading-7 text-white/65">{level.summary}</p>
              <p className="mt-3 text-sm text-white/45">{level.focus}</p>
              <div className="mt-4 inline-flex rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                {completed}/{lessons.length} complete
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {picoTracks.map((track) => {
          const lessons = getPicoLessonsByTrack(track.id);
          const completed = lessons.filter((lesson) => state.completedLessonSlugs.includes(lesson.slug)).length;

          return (
            <div key={track.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
              <div className={`h-20 rounded-2xl bg-gradient-to-r ${track.color}`} />
              <p className="mt-4 text-lg font-semibold text-white">{track.title}</p>
              <p className="mt-2 text-sm leading-7 text-white/65">{track.summary}</p>
              <p className="mt-3 text-sm text-cyan-100/90">Outcome: {track.outcome}</p>
              <p className="mt-3 text-sm text-white/45">{completed} of {lessons.length} tutorials complete in this track.</p>
            </div>
          );
        })}
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100/90">Lessons</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">All 12 tutorials</h2>
          </div>
          <Link href={academyHref} className="text-sm font-semibold text-white/50">
            Ordered for first launch, then operations.
          </Link>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {picoLessons.map((lesson) => {
            const completed = state.completedLessonSlugs.includes(lesson.slug);

            return (
              <Link
                key={lesson.slug}
                href={buildPicoPath(basePath, `/academy/${lesson.slug}`)}
                className="group rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.06]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                      {picoLevels.find((level) => level.id === lesson.levelId)?.title} · {picoTracks.find((track) => track.id === lesson.trackId)?.title}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{lesson.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/65">{lesson.summary}</p>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${completed ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-200" : "border border-white/10 bg-white/5 text-white/65"}`}>
                    {completed ? "Completed" : "Ready"}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/50">
                  <span className="rounded-full border border-white/10 px-3 py-1">{lesson.durationMinutes} min</span>
                  <span className="rounded-full border border-white/10 px-3 py-1">{lesson.deliverable}</span>
                </div>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100 transition group-hover:translate-x-1">
                  Open lesson <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </PicoProductShell>
  );
}
