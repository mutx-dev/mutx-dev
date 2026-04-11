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
} from "@/lib/pico/academy";
import {
  formatPicoEventLabel,
  getPicoBadgeProgress,
  getPicoTrackProgress,
} from "@/lib/pico/academy";
import { buildPicoPath } from "@/lib/pico/routing";

function AutoProgressSummary({ metadata }: { metadata: Record<string, unknown> }) {
  const autoProgress =
    metadata.auto_progress && typeof metadata.auto_progress === "object" && !Array.isArray(metadata.auto_progress)
      ? (metadata.auto_progress as Record<string, unknown>)
      : null;

  const parts = [
    ...(Array.isArray(autoProgress?.completed_tracks)
      ? [`track${autoProgress.completed_tracks.length > 1 ? "s" : ""}: ${autoProgress.completed_tracks.join(", ")}`]
      : []),
    ...(Array.isArray(autoProgress?.badges)
      ? [`badge${autoProgress.badges.length > 1 ? "s" : ""}: ${autoProgress.badges.join(", ")}`]
      : []),
    ...(Array.isArray(autoProgress?.milestones)
      ? [`milestone${autoProgress.milestones.length > 1 ? "s" : ""}: ${autoProgress.milestones.join(", ")}`]
      : []),
  ].filter((value) => !value.endsWith(": "));

  if (parts.length === 0) {
    return null;
  }

  return <p className="mt-2 text-xs text-cyan-100/70">Auto-awarded: {parts.join(" · ")}</p>;
}

export function PicoAcademyPage() {
  const basePath = usePicoBasePath();
  const { state, loading, error, refresh } = usePicoState();
  const academyHref = buildPicoPath(basePath, "/academy");
  const supportHref = buildPicoPath(basePath, "/support");
  const loginHref = buildPicoPath(basePath, "/login");
  const registerHref = buildPicoPath(basePath, "/register");
  const nextLesson =
    picoLessons.find((lesson) => !state.completedLessonSlugs.includes(lesson.slug)) ?? picoLessons[0];
  const nextLessonHref = buildPicoPath(basePath, `/academy/${nextLesson.slug}`);
  const trackProgress = getPicoTrackProgress(state.completedLessonSlugs, state.completedTrackIds);
  const badgeProgress = getPicoBadgeProgress(state.completedLessonSlugs, state.badges);
  const earnedBadgeCount = badgeProgress.filter((badge) => badge.earned).length;
  const nextBadge = badgeProgress.find((badge) => !badge.earned) ?? null;
  const recentEvents = [...state.recentEvents].slice(-4).reverse();

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
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100/90">Progress</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Move one lesson at a time.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">
                Progress is loaded from /api/pico/state when you are signed in. Completion is recorded from each lesson page through /api/pico/events. Track finishes, badges, and milestone unlocks now surface directly from that state instead of staying implicit.
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-100/70">Completion</p>
              <p className="mt-1 text-3xl font-semibold text-white">{state.percentComplete}%</p>
              <p className="text-sm text-white/60">
                {state.completedCount} of {picoLessons.length} tutorials done
              </p>
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
              <p className="mt-2 text-lg font-semibold text-white">Your progression is now explicit.</p>
              <p className="mt-2 text-sm leading-7 text-white/65">
                Level, XP runway, tutor allowance, badges, and control milestones all sync through the same Pico state record.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-white/10 bg-[#0a101b] px-4 py-3">
                  <p className="text-white/45">Level</p>
                  <p className="mt-1 text-xl font-semibold text-white">{state.currentLevel}</p>
                  <p className="text-xs text-white/45">{state.levelProgress.progressPercent}% to next</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0a101b] px-4 py-3">
                  <p className="text-white/45">XP</p>
                  <p className="mt-1 text-xl font-semibold text-white">{state.xpTotal}</p>
                  <p className="text-xs text-white/45">
                    {state.levelProgress.xpToNextLevel === null
                      ? "Top academy level reached"
                      : `${state.levelProgress.xpToNextLevel} XP to level ${state.levelProgress.nextLevel}`}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0a101b] px-4 py-3">
                  <p className="text-white/45">Badges</p>
                  <p className="mt-1 text-xl font-semibold text-white">{earnedBadgeCount}</p>
                  <p className="text-xs text-white/45">{badgeProgress.length} available right now</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#0a101b] px-4 py-3">
                  <p className="text-white/45">Tutor</p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {state.tutorAccess.remaining ?? "∞"}
                  </p>
                  <p className="text-xs text-white/45">
                    {state.tutorAccess.limit === null
                      ? "Unmetered in this build"
                      : `${state.tutorSessionsUsed}/${state.tutorAccess.limit} used`}
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] px-4 py-3 text-sm text-cyan-50">
                {state.tutorAccess.note}
                <div className="mt-3">
                  <Link href={supportHref} className="font-semibold text-white">
                    Open grounded tutor
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 p-2 text-amber-200">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <p className="mt-3 text-lg font-semibold text-white">Sign in to save lesson progress.</p>
              <p className="mt-2 text-sm leading-7 text-white/65">
                The academy content is open, but progress, badges, and plan-based tutor limits need an authenticated session.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href={loginHref} className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950">
                  Sign in
                </Link>
                <Link href={registerHref} className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/85">
                  Create account
                </Link>
              </div>
            </>
          )}
        </aside>
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100/90">XP runway</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Your next level is visible.</h2>
            </div>
            <div className="text-right text-sm text-white/55">
              <p>Current level {state.currentLevel}</p>
              <p>
                {state.levelProgress.nextLevel === null
                  ? "All Pico levels complete"
                  : `Next level ${state.levelProgress.nextLevel} at ${state.levelProgress.nextLevelTargetXp} XP`}
              </p>
            </div>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-cyan-300 transition-all"
              style={{ width: `${state.levelProgress.progressPercent}%` }}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-white/60">
            <span className="rounded-full border border-white/10 px-3 py-1">
              {state.levelProgress.xpIntoLevel} XP into level {state.currentLevel}
            </span>
            {state.levelProgress.xpToNextLevel !== null ? (
              <span className="rounded-full border border-white/10 px-3 py-1">
                {state.levelProgress.xpToNextLevel} XP to next unlock
              </span>
            ) : (
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-emerald-200">
                Level cap reached
              </span>
            )}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100/90">Next badge</p>
          {nextBadge ? (
            <>
              <h2 className="mt-2 text-2xl font-semibold text-white">{nextBadge.title}</h2>
              <p className="mt-2 text-sm leading-7 text-white/65">{nextBadge.description}</p>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-cyan-300 transition-all"
                  style={{ width: `${nextBadge.progressPercent}%` }}
                />
              </div>
              <p className="mt-4 text-sm text-white/55">
                {nextBadge.completedLessons} of {nextBadge.totalLessons} required lessons finished.
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-2xl font-semibold text-white">Badge board cleared</h2>
              <p className="mt-2 text-sm leading-7 text-white/65">
                You have earned every badge currently defined in Pico Academy.
              </p>
            </>
          )}
        </div>
      </section>

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
        {trackProgress.map((track) => {
          const lessons = getPicoLessonsByTrack(track.id);

          return (
            <div key={track.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
              <div className={`h-20 rounded-2xl bg-gradient-to-r ${track.color}`} />
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-white">{track.title}</p>
                  <p className="mt-2 text-sm leading-7 text-white/65">{track.summary}</p>
                </div>
                <div
                  className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                    track.completed
                      ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                      : "border border-white/10 bg-white/5 text-white/65"
                  }`}
                >
                  {track.completed ? "Completed" : `${track.progressPercent}%`}
                </div>
              </div>
              <p className="mt-3 text-sm text-cyan-100/90">Outcome: {track.outcome}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-cyan-300" style={{ width: `${track.progressPercent}%` }} />
              </div>
              <p className="mt-3 text-sm text-white/45">
                {track.completedLessons} of {lessons.length} tutorials complete in this track.
              </p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100/90">Badges</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">What you have actually unlocked</h2>
            </div>
            <p className="text-sm text-white/55">{earnedBadgeCount} earned</p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {badgeProgress.map((badge) => (
              <div key={badge.id} className="rounded-[1.25rem] border border-white/10 bg-[#0a101b] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{badge.title}</p>
                    <p className="mt-2 text-sm leading-6 text-white/60">{badge.description}</p>
                  </div>
                  <div
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                      badge.earned
                        ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                        : "border border-white/10 bg-white/5 text-white/65"
                    }`}
                  >
                    {badge.earned ? "Earned" : `${badge.progressPercent}%`}
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-cyan-300" style={{ width: `${badge.progressPercent}%` }} />
                </div>
                <p className="mt-3 text-sm text-white/45">
                  {badge.completedLessons}/{badge.totalLessons} lessons complete
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-100/90">Recent activity</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">The latest proof points</h2>
            </div>
            <Link href={supportHref} className="text-sm font-semibold text-white/55">
              Tutor and controls stay tied to this timeline.
            </Link>
          </div>
          {recentEvents.length > 0 ? (
            <div className="mt-5 space-y-4">
              {recentEvents.map((event, index) => (
                <div key={`${event.event}-${event.createdAt ?? index}`} className="rounded-[1.25rem] border border-white/10 bg-[#0a101b] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{formatPicoEventLabel(event.event)}</p>
                      <p className="mt-2 text-sm text-white/55">
                        {event.createdAt ? new Date(event.createdAt).toLocaleString() : "No timestamp returned"}
                      </p>
                    </div>
                    <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
                      +{event.xpAwarded} XP
                    </div>
                  </div>
                  {event.lessonId ? <p className="mt-3 text-sm text-white/60">Lesson: {event.lessonId}</p> : null}
                  {event.trackId ? <p className="mt-1 text-sm text-white/60">Track: {event.trackId}</p> : null}
                  {event.badgeId ? <p className="mt-1 text-sm text-white/60">Badge: {event.badgeId}</p> : null}
                  {event.milestoneId ? <p className="mt-1 text-sm text-white/60">Milestone: {event.milestoneId}</p> : null}
                  <AutoProgressSummary metadata={event.metadata} />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm leading-7 text-white/60">
              Finish a lesson, save a threshold, or use the grounded tutor once you are signed in. Those actions now leave visible state behind.
            </p>
          )}
        </div>
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
                  <span className="rounded-full border border-white/10 px-3 py-1">Badge: {lesson.badge}</span>
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
