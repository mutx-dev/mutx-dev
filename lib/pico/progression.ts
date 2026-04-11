import { picoLessons, picoTracks, type PicoLesson } from "@/lib/pico/course";

const badgeDescriptions: Record<string, string> = {
  "first-boot": "You proved the runtime installs and answers back.",
  deployed: "Your agent is now living somewhere more durable than one shell session.",
  "interface-online": "A real interface lane is wired in, not just terminal vibes.",
  capable: "The runtime can do one useful thing on purpose.",
  "automation-online": "A repeatable workflow exists and can run again tomorrow.",
  "operator-aware": "You can actually see what the runtime is doing.",
  guarded: "Budgets and approvals are in place before the embarrassing failure.",
  "production-ready": "You have a reusable pattern with operational ownership.",
};

function titleCase(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function groupLessonsByBadge() {
  const groups = new Map<string, PicoLesson[]>();
  for (const lesson of picoLessons) {
    const existing = groups.get(lesson.badge) ?? [];
    existing.push(lesson);
    groups.set(lesson.badge, existing);
  }
  return Array.from(groups.entries()).map(([id, lessons]) => ({ id, lessons }));
}

export type PicoTrackProgress = {
  id: string;
  title: string;
  summary: string;
  outcome: string;
  color: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  completed: boolean;
};

export type PicoBadgeProgress = {
  id: string;
  title: string;
  description: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  earned: boolean;
};

export function getPicoTrackProgress(completedLessonSlugs: string[], completedTrackIds: string[]) {
  const completed = new Set(completedLessonSlugs);
  const completedTracks = new Set(completedTrackIds);

  return picoTracks.map((track) => {
    const lessons = picoLessons.filter((lesson) => lesson.trackId === track.id);
    const completedLessons = lessons.filter((lesson) => completed.has(lesson.slug)).length;
    const totalLessons = lessons.length;
    const completedTrack = completedTracks.has(track.id) || completedLessons === totalLessons;

    return {
      id: track.id,
      title: track.title,
      summary: track.summary,
      outcome: track.outcome,
      color: track.color,
      completedLessons,
      totalLessons,
      progressPercent: totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100),
      completed: completedTrack,
    } satisfies PicoTrackProgress;
  });
}

export function getPicoBadgeProgress(completedLessonSlugs: string[], earnedBadgeIds: string[]) {
  const completed = new Set(completedLessonSlugs);
  const earned = new Set(earnedBadgeIds);

  return groupLessonsByBadge().map(({ id, lessons }) => {
    const completedLessons = lessons.filter((lesson) => completed.has(lesson.slug)).length;
    const totalLessons = lessons.length;
    const badgeEarned = earned.has(id) || completedLessons === totalLessons;

    return {
      id,
      title: titleCase(id),
      description: badgeDescriptions[id] ?? "Progress badge earned by finishing the required Pico lessons.",
      completedLessons,
      totalLessons,
      progressPercent: totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100),
      earned: badgeEarned,
    } satisfies PicoBadgeProgress;
  });
}

export function formatPicoEventLabel(event: string) {
  switch (event) {
    case "lesson_completed":
      return "Lesson completed";
    case "track_completed":
      return "Track completed";
    case "badge_earned":
      return "Badge earned";
    case "milestone_reached":
      return "Milestone reached";
    case "tutor_session_used":
      return "Grounded tutor lookup";
    case "starter_agent_deployed":
      return "Starter agent deployed";
    case "first_agent_run":
      return "First agent run";
    case "cost_threshold_set":
      return "Cost threshold saved";
    case "approval_gate_enabled":
      return "Approval gate enabled";
    default:
      return titleCase(event.replace(/_/g, "-"));
  }
}
