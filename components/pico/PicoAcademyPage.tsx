"use client";

import Link from "next/link";
import { ArrowRight, LockKeyhole, RefreshCw } from "lucide-react";

import { PicoProductShell } from "@/components/pico/PicoProductShell";
import { usePicoBasePath } from "@/components/pico/PicoPathProvider";
import {
  picoPrimaryButtonClass,
  picoSecondaryButtonClass,
  picoSectionLabelClass,
  picoSurfaceClass,
  picoSurfaceInsetClass,
  picoSurfaceStrongClass,
} from "@/components/pico/picoUi";
import { usePicoState } from "@/components/pico/usePicoState";
import {
  formatPicoEventLabel,
  getPicoBadgeProgress,
  getPicoLessonsByTrack,
  getPicoTrackProgress,
  picoLessons,
  picoTracks,
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
      description="Twelve concrete tutorials that move from first agent to controlled runtime. The page should answer one question fast: what should you do next?"
      actions={
        <>
          <Link href={nextLessonHref} className={picoPrimaryButtonClass}>
            Continue {nextLesson.title} <ArrowRight className="h-4 w-4" />
          </Link>
          <button type="button" onClick={() => void refresh()} className={picoSecondaryButtonClass}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh progress
          </button>
        </>
      }
    >
      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className={`${picoSurfaceStrongClass} p-6`}>
          <p className={picoSectionLabelClass}>Recommended next</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">{nextLesson.title}</h2>
          <p className="mt-3 text-sm leading-7 text-white/70">{nextLesson.summary}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className={`${picoSurfaceInsetClass} px-4 py-3`}>
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">Deliverable</p>
              <p className="mt-2 text-sm text-white/80">{nextLesson.deliverable}</p>
            </div>
            <div className={`${picoSurfaceInsetClass} px-4 py-3`}>
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">Why it matters</p>
              <p className="mt-2 text-sm text-white/80">{nextLesson.projectOutcome}</p>
            </div>
            <div className={`${picoSurfaceInsetClass} px-4 py-3`}>
              <p className="text-xs uppercase tracking-[0.18em] text-white/45">Estimated time</p>
              <p className="mt-2 text-sm text-white/80">{nextLesson.durationMinutes} min</p>
            </div>
          </div>
          {nextLesson.prerequisites.length > 0 ? (
            <div className={`${picoSurfaceInsetClass} mt-4 p-4`}>
              <p className="text-sm font-semibold text-white">Prerequisites</p>
              <ul className="mt-3 space-y-2 text-sm text-white/65">
                {nextLesson.prerequisites.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={nextLessonHref} className={picoPrimaryButtonClass}>
              Open lesson <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href={supportHref} className={picoSecondaryButtonClass}>
              Ask grounded support
            </Link>
          </div>
        </div>

        <aside className={`${picoSurfaceClass} p-6`}>
          {state.authenticated ? (
            <>
              <p className={picoSectionLabelClass}>Progress snapshot</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Keep the momentum visible.</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className={`${picoSurfaceInsetClass} px-4 py-3`}>
                  <p className="text-white/45">Completion</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{state.percentComplete}%</p>
                  <p className="text-xs text-white/45">{state.completedCount}/{picoLessons.length} tutorials</p>
                </div>
                <div className={`${picoSurfaceInsetClass} px-4 py-3`}>
                  <p className="text-white/45">Level</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{state.currentLevel}</p>
                  <p className="text-xs text-white/45">{state.levelProgress.progressPercent}% to next</p>
                </div>
                <div className={`${picoSurfaceInsetClass} px-4 py-3`}>
                  <p className="text-white/45">XP</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{state.xpTotal}</p>
                  <p className="text-xs text-white/45">
                    {state.levelProgress.xpToNextLevel === null
                      ? "Level cap reached"
                      : `${state.levelProgress.xpToNextLevel} XP to next level`}
                  </p>
                </div>
                <div className={`${picoSurfaceInsetClass} px-4 py-3`}>
                  <p className="text-white/45">Badges</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{earnedBadgeCount}</p>
                  <p className="text-xs text-white/45">{badgeProgress.length} total available</p>
                </div>
              </div>
              {nextBadge ? (
                <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] px-4 py-3 text-sm text-cyan-50">
                  Next badge: {nextBadge.title} ({nextBadge.completedLessons}/{nextBadge.totalLessons} lessons complete)
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className="inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 p-2 text-amber-200">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <p className="mt-3 text-lg font-semibold text-white">Sign in to keep this momentum.</p>
              <p className="mt-2 text-sm leading-7 text-white/65">
                The lesson corpus is open, but saved progress, badge unlocks, and tutor tracking need a real session.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href={loginHref} className={picoPrimaryButtonClass}>
                  Sign in
                </Link>
                <Link href={registerHref} className={picoSecondaryButtonClass}>
                  Create account
                </Link>
              </div>
            </>
          )}
          {error ? <p className="mt-4 text-sm text-amber-200">{error}</p> : null}
        </aside>
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={picoSectionLabelClass}>Lessons</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Pick one lesson and move.</h2>
          </div>
          <p className="text-sm text-white/50">The recommended next lesson stays heavy; the rest are just quick options.</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {picoLessons.map((lesson) => {
            const completed = state.completedLessonSlugs.includes(lesson.slug);
            const recommended = !completed && lesson.slug === nextLesson.slug;
            const lessonHref = buildPicoPath(basePath, `/academy/${lesson.slug}`);
            const levelTitle = lesson.levelId.replace("level-", "Level ");
            const trackTitle = picoTracks.find((track) => track.id === lesson.trackId)?.title ?? lesson.trackId;
            const prerequisiteSummary =
              lesson.prerequisites.length === 0
                ? "No prerequisites"
                : lesson.prerequisites.join(" · ");

            return (
              <Link
                key={lesson.slug}
                href={lessonHref}
                className={`group p-5 transition ${recommended ? picoSurfaceStrongClass : picoSurfaceClass} hover:border-cyan-300/30 hover:bg-cyan-300/[0.06]`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                      {levelTitle} · {trackTitle}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{lesson.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/65">{lesson.summary}</p>
                  </div>
                  <div
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                      completed
                        ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                        : recommended
                          ? "border border-cyan-300/20 bg-cyan-300/10 text-cyan-100"
                          : "border border-white/10 bg-white/5 text-white/65"
                    }`}
                  >
                    {completed ? "Completed" : recommended ? "Recommended next" : "Queued"}
                  </div>
                </div>

                <div className={`${picoSurfaceInsetClass} mt-4 flex flex-wrap items-start justify-between gap-3 px-4 py-3 text-sm text-white/70`}>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">Deliverable</p>
                    <p className="mt-1 text-white/85">{lesson.deliverable}</p>
                  </div>
                  <div className="max-w-sm text-right">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">Needs</p>
                    <p className="mt-1 text-white/65">{prerequisiteSummary}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/50">
                  <span className="rounded-full border border-white/10 px-3 py-1">{lesson.durationMinutes} min</span>
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

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className={`${picoSurfaceClass} p-6`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={picoSectionLabelClass}>Track progress</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">The map is still here, just lower on the page.</h2>
            </div>
            <p className="text-sm text-white/55">Reference, not the main call to action.</p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {trackProgress.map((track) => {
              const lessons = getPicoLessonsByTrack(track.id);
              return (
                <div key={track.id} className={`${picoSurfaceInsetClass} p-4`}>
                  <div className={`h-16 rounded-2xl bg-gradient-to-r ${track.color}`} />
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">{track.title}</p>
                      <p className="mt-2 text-sm text-white/60">{track.outcome}</p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
                      {track.completed ? "Completed" : `${track.progressPercent}%`}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-white/45">
                    {track.completedLessons} of {lessons.length} tutorials complete.
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className={`${picoSurfaceClass} p-6`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={picoSectionLabelClass}>Badge board</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">What unlocked recently</h2>
              </div>
              <p className="text-sm text-white/55">{earnedBadgeCount} earned</p>
            </div>
            <div className="mt-5 space-y-3">
              {badgeProgress.slice(0, 4).map((badge) => (
                <div key={badge.id} className={`${picoSurfaceInsetClass} p-4`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">{badge.title}</p>
                      <p className="mt-2 text-sm text-white/60">{badge.description}</p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
                      {badge.earned ? "Earned" : `${badge.progressPercent}%`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`${picoSurfaceClass} p-6`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={picoSectionLabelClass}>Recent activity</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Receipts, not vibes</h2>
              </div>
              <Link href={supportHref} className="text-sm font-semibold text-white/55">
                Support stays tied to this timeline.
              </Link>
            </div>
            {recentEvents.length > 0 ? (
              <div className="mt-5 space-y-3">
                {recentEvents.map((event, index) => (
                  <div key={`${event.event}-${event.createdAt ?? index}`} className={`${picoSurfaceInsetClass} p-4`}>
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
                    <AutoProgressSummary metadata={event.metadata} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm leading-7 text-white/60">
                Finish a lesson, save a threshold, or use grounded support while signed in. That is when the academy starts leaving receipts behind.
              </p>
            )}
          </div>
        </div>
      </section>
    </PicoProductShell>
  );
}
