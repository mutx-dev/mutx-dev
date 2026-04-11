'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { PicoShell } from '@/components/pico/PicoShell'
import { usePicoProgress } from '@/components/pico/usePicoProgress'
import { PICO_LEVELS, PICO_TRACKS, getLessonBySlug } from '@/lib/pico/academy'
import { usePicoHref } from '@/lib/pico/navigation'

function ProgressCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-5 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-300">{hint}</p>
    </div>
  )
}

export function PicoAcademyDashboard() {
  const router = useRouter()
  const { progress, derived, syncState, ready, actions } = usePicoProgress()
  const toHref = usePicoHref()
  const nextLesson = derived.nextLesson

  return (
    <PicoShell
      eyebrow="Academy core"
      title="Build the first agent you can actually trust"
      description="This is the narrowest honest loop: learn, ship, observe, and control. No toy demos. No dashboard cosplay."
      actions={
        nextLesson ? (
          <>
            <Link
              href={toHref(`/academy/${nextLesson.slug}`)}
              className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Continue with {nextLesson.title}
            </Link>
            <button
              type="button"
              onClick={() => actions.pickTrack(progress.selectedTrack ?? 'first-agent')}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              Sync state: {syncState}
            </button>
          </>
        ) : null
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ProgressCard
          label="XP"
          value={String(derived.xp)}
          hint="XP comes from finished lessons, milestones, and completed tracks."
        />
        <ProgressCard
          label="Lessons"
          value={`${derived.completedLessonCount}/${derived.totalLessons}`}
          hint="Every lesson defines a real artifact or operating action to finish."
        />
        <ProgressCard
          label="Level"
          value={`L${derived.currentLevel}`}
          hint={PICO_LEVELS.find((item) => item.id === derived.currentLevel)?.title ?? 'Setup'}
        />
        <ProgressCard
          label="Badges"
          value={String(derived.badges.length)}
          hint={derived.badges[0] ?? 'No badge yet. Finish the first two lessons.'}
        />
      </div>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr,0.8fr]">
        <div className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Next move</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {nextLesson ? nextLesson.title : 'You cleared the current academy map'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {nextLesson
                  ? nextLesson.summary
                  : 'Time to harden the autopilot bridge or add a stronger production pattern.'}
              </p>
            </div>
            {nextLesson ? (
              <button
                type="button"
                onClick={() => {
                  actions.startLesson(nextLesson.slug)
                  router.push(toHref(`/academy/${nextLesson.slug}`))
                }}
                className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100"
              >
                Start lesson
              </button>
            ) : null}
          </div>
          <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
            {nextLesson ? (
              <>
                <p className="font-medium text-white">Validation</p>
                <p className="mt-2">{nextLesson.validation}</p>
                <p className="mt-4 font-medium text-white">Expected result</p>
                <p className="mt-2">{nextLesson.expectedResult}</p>
              </>
            ) : (
              <p>Open Autopilot and run the control loop against live data. That is the point of the whole thing.</p>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">State</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Progress sync</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p>Ready: {ready ? 'yes' : 'loading'}</p>
            <p>Sync mode: {syncState}</p>
            <p>Selected track: {progress.selectedTrack ?? 'none yet'}</p>
            <p>Started lessons: {progress.startedLessons.length}</p>
            <p>Tutor questions: {progress.tutorQuestions}</p>
            <p>Support requests: {progress.supportRequests}</p>
          </div>
          {derived.badges.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {derived.badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-100"
                >
                  {badge}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-6 rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Tracks</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Project-based learning paths</h2>
          </div>
          <Link href={toHref('/onboarding')} className="text-sm font-medium text-emerald-200 hover:text-emerald-100">
            Open onboarding
          </Link>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {PICO_TRACKS.map((track) => {
            const completedCount = track.lessons.filter((lessonSlug) => progress.completedLessons.includes(lessonSlug)).length
            const trackLessons = track.lessons.flatMap((lessonSlug) => {
              const lesson = getLessonBySlug(lessonSlug)
              return lesson ? [lesson] : []
            })
            return (
              <article key={track.slug} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{track.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{track.intro}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => actions.pickTrack(track.slug)}
                    className="rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10"
                  >
                    {progress.selectedTrack === track.slug ? 'Selected' : 'Set active'}
                  </button>
                </div>
                <p className="mt-4 text-sm text-emerald-100">Outcome: {track.outcome}</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-900/60">
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{ width: `${(completedCount / track.lessons.length) * 100}%` }}
                  />
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                  {completedCount}/{track.lessons.length} lessons complete
                </p>
                <div className="mt-4 space-y-2">
                  {trackLessons.map((lesson) => (
                    <Link
                      key={lesson.slug}
                      href={toHref(`/academy/${lesson.slug}`)}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] px-4 py-3 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/5"
                    >
                      <span>{lesson.title}</span>
                      <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        {progress.completedLessons.includes(lesson.slug) ? 'done' : `+${lesson.xp} xp`}
                      </span>
                    </Link>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="mt-6 rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Levels</p>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {PICO_LEVELS.map((level) => {
            const levelLessons = PICO_LEVELS[level.id] ? PICO_LEVELS[level.id] : level
            const lessons = PICO_TRACKS.flatMap((track) => track.lessons)
            void levelLessons
            void lessons
            const completed = progress.completedLessons.filter((lessonSlug) => {
              const lesson = getLessonBySlug(lessonSlug)
              return lesson?.level === level.id
            }).length
            const total = PICO_TRACKS.flatMap((track) => track.lessons).filter((lessonSlug) => getLessonBySlug(lessonSlug)?.level === level.id).length
            return (
              <div key={level.id} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Level {level.id}</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{level.title}</h3>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                    {level.badge}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{level.objective}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] p-4 text-sm text-slate-300">
                    <p className="font-medium text-white">Outcome</p>
                    <p className="mt-2">{level.projectOutcome}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] p-4 text-sm text-slate-300">
                    <p className="font-medium text-white">Completion</p>
                    <p className="mt-2">{level.completionState}</p>
                  </div>
                </div>
                <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">
                  {completed}/{total} lessons complete • reward {level.xpReward} xp
                </p>
              </div>
            )
          })}
        </div>
      </section>
    </PicoShell>
  )
}
