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
  const installDone = progress.completedLessons.includes('install-hermes-locally')
  const firstRunDone = progress.completedLessons.includes('run-your-first-agent')
  const activationLessonSlug = firstRunDone
    ? (nextLesson?.slug ?? 'deploy-hermes-on-a-vps')
    : installDone
      ? 'run-your-first-agent'
      : 'install-hermes-locally'
  const activationLesson = getLessonBySlug(activationLessonSlug)
  const activationTrack = PICO_TRACKS[0]

  return (
    <PicoShell
      eyebrow="Academy core"
      title="Get to the first working agent, then widen out"
      description="The fastest path is boring on purpose: install Hermes, run one prompt, keep the proof, then move on."
      actions={
        <Link
          href={toHref(`/academy/${activationLessonSlug}`)}
          className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
        >
          {installDone ? (firstRunDone ? `Continue with ${nextLesson?.title ?? 'the next lesson'}` : 'Run your first agent') : 'Install Hermes now'}
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ProgressCard
          label="XP"
          value={String(derived.xp)}
          hint="XP comes from real lesson completions, not random clicking."
        />
        <ProgressCard
          label="Lessons"
          value={`${derived.completedLessonCount}/${derived.totalLessons}`}
          hint="The only count that matters right now is the first two." 
        />
        <ProgressCard
          label="Level"
          value={`L${derived.currentLevel}`}
          hint={PICO_LEVELS.find((item) => item.id === derived.currentLevel)?.title ?? 'Setup'}
        />
        <ProgressCard
          label="Sync"
          value={ready ? syncState : 'loading'}
          hint="Progress persists while you move fast."
        />
      </div>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr,0.85fr]">
        <div className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Activation path</p>
          <div className="mt-4 rounded-[24px] border border-emerald-400/20 bg-emerald-400/10 p-5 text-sm text-slate-200">
            <p className="font-medium text-white">What to do next</p>
            <p className="mt-2">
              {!installDone
                ? 'Install Hermes from the first lesson. Do not browse the rest of the academy yet.'
                : !firstRunDone
                  ? 'Good. The runtime is installed. Now run one tiny prompt and get one visible answer back.'
                  : `You cleared the first win. Continue with ${nextLesson?.title ?? 'the next lesson'} while the momentum is still hot.`}
            </p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <p className="font-medium text-white">1. Install</p>
              <p className="mt-2">Make `hermes` open from a fresh shell.</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <p className="font-medium text-white">2. Run</p>
              <p className="mt-2">Use one tiny prompt with an obvious answer.</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <p className="font-medium text-white">3. Keep proof</p>
              <p className="mt-2">Save the output so the win is reusable, not imaginary.</p>
            </div>
          </div>
          <div className="mt-5 rounded-[24px] border border-white/10 bg-[rgba(3,8,20,0.45)] p-5 text-sm text-slate-300">
            {activationLesson ? (
              <>
                <p className="font-medium text-white">Visible success moment</p>
                <p className="mt-2">{activationLesson.expectedResult}</p>
                <p className="mt-4 font-medium text-white">Validation</p>
                <p className="mt-2">{activationLesson.validation}</p>
              </>
            ) : (
              <p>No activation lesson is available right now.</p>
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Current path</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Stay on one track</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p>Active track: {progress.selectedTrack ?? activationTrack.slug}</p>
            <p>Current lesson: {activationLesson?.title ?? 'none'}</p>
            <p>Completed lessons: {derived.completedLessonCount}</p>
            <p>Badges: {derived.badges.length}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              actions.startLesson(activationLessonSlug)
              router.push(toHref(`/academy/${activationLessonSlug}`))
            }}
            className="mt-5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100"
          >
            Open the fastest next step
          </button>
        </div>
      </section>

      {!firstRunDone ? (
        <section className="mt-6 rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Ignore for now</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">The rest of the academy can wait</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Deployment, automation, monitoring, and approvals matter later. In the first 10 minutes they are just extra choices slowing down the first visible result.
          </p>
        </section>
      ) : (
        <>
          <section className="mt-6 rounded-[28px] border border-white/10 bg-[rgba(8,15,28,0.82)] p-6 shadow-[0_24px_80px_rgba(2,8,23,0.25)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Tracks</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Project-based learning paths</h2>
              </div>
              <span className="text-sm text-slate-400">One track active. One lesson next.</span>
            </div>
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {PICO_TRACKS.map((track) => {
                const completedCount = track.lessons.filter((lessonSlug) => progress.completedLessons.includes(lessonSlug)).length
                const nextTrackLesson = track.lessons
                  .map((lessonSlug) => getLessonBySlug(lessonSlug))
                  .find((lesson) => lesson && derived.unlockedLessonSlugs.includes(lesson.slug) && !progress.completedLessons.includes(lesson.slug))
                const firstTrackLesson = getLessonBySlug(track.lessons[0])
                const unlocked = derived.unlockedTrackSlugs.includes(track.slug)
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
                        disabled={!unlocked}
                        className="rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {progress.selectedTrack === track.slug ? 'Active track' : unlocked ? 'Set as track' : 'Locked'}
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
                    <div className="mt-4 rounded-2xl border border-white/10 bg-[rgba(3,8,20,0.45)] p-4 text-sm text-slate-300">
                      {nextTrackLesson
                        ? `Next lesson in this track: ${nextTrackLesson.title}`
                        : unlocked && firstTrackLesson
                          ? `Start with ${firstTrackLesson.title}.`
                          : 'Finish the previous track before you open this one.'}
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
                    <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-500">
                      {completed}/{total} lessons complete • reward {level.xpReward} xp
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}
    </PicoShell>
  )
}
