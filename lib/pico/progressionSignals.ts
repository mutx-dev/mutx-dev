import { getPicoLesson, getPicoTrackProgress, picoTracks, type PicoTrackProgress } from "@/lib/pico/academy";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item): item is string => item.length > 0);
}

function titleCase(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const milestoneLabels: Record<string, string> = {
  first_lesson_finished: "First lesson finished",
  first_track_finished: "First track finished",
  academy_completed: "Academy completed",
  starter_agent_live: "Starter agent live",
  budget_guardrail_set: "Alert threshold configured",
  approval_guardrail_live: "Approval gate live",
  grounded_tutor_used: "Tutor used",
};

function formatMilestoneLabel(id: string) {
  return milestoneLabels[id] ?? titleCase(id.replace(/_/g, "-"));
}

function formatBadgeLabel(id: string) {
  return titleCase(id);
}

function formatTrackLabel(id: string) {
  return picoTracks.find((track) => track.id === id)?.title ?? titleCase(id);
}

function getAutoProgress(metadata: Record<string, unknown>) {
  const autoProgress =
    isRecord(metadata.auto_progress) ? metadata.auto_progress : null;

  return {
    completedTracks: toStringArray(autoProgress?.completed_tracks),
    badges: toStringArray(autoProgress?.badges),
    milestones: toStringArray(autoProgress?.milestones),
  };
}

function getLevelUp(metadata: Record<string, unknown>) {
  const levelUp = isRecord(metadata.level_up) ? metadata.level_up : null;
  const from = typeof levelUp?.from === "number" ? levelUp.from : null;
  const to = typeof levelUp?.to === "number" ? levelUp.to : null;

  if (from === null || to === null || to <= from) {
    return null;
  }

  return { from, to };
}

export type PicoProgressSignalEvent = {
  event: string;
  xpAwarded: number;
  lessonId: string | null;
  metadata: Record<string, unknown>;
};

export type PicoProgressMoment = {
  title: string;
  body: string;
  chips: string[];
  unlockedBadges: string[];
  unlockedMilestones: string[];
  unlockedTracks: string[];
  levelUp: { from: number; to: number } | null;
};

export type PicoNextMilestone = {
  id: string;
  title: string;
  body: string;
  path: string;
  actionLabel: string;
};

export function getNextPicoLessonFromState(completedLessonSlugs: string[]) {
  const completed = new Set(completedLessonSlugs);
  return [
    "install-hermes-locally",
    "run-your-first-agent",
    "deploy-hermes-on-a-vps",
    "keep-your-agent-alive-between-sessions",
    "connect-a-messaging-or-interface-layer",
    "add-your-first-skill-tool",
    "create-a-scheduled-workflow",
    "see-your-agent-activity",
    "set-a-cost-threshold",
    "add-an-approval-gate",
    "build-a-lead-response-style-agent",
    "build-a-document-processing-style-agent",
  ]
    .map((slug) => getPicoLesson(slug))
    .find((lesson) => lesson && !completed.has(lesson.slug)) ?? null;
}

export function getLatestMeaningfulPicoEvent(events: PicoProgressSignalEvent[]) {
  return [...events].reverse().find((event) => {
    const autoProgress = getAutoProgress(event.metadata);
    return (
      event.xpAwarded > 0 ||
      autoProgress.badges.length > 0 ||
      autoProgress.milestones.length > 0 ||
      autoProgress.completedTracks.length > 0
    );
  }) ?? null;
}

export function describePicoProgressMoment(event: PicoProgressSignalEvent): PicoProgressMoment {
  const lesson = event.lessonId ? getPicoLesson(event.lessonId) : null;
  const autoProgress = getAutoProgress(event.metadata);
  const levelUp = getLevelUp(event.metadata);
  const unlockedBadges = autoProgress.badges.map(formatBadgeLabel);
  const unlockedMilestones = autoProgress.milestones.map(formatMilestoneLabel);
  const unlockedTracks = autoProgress.completedTracks.map(formatTrackLabel);
  const chips = [
    ...(event.xpAwarded > 0 ? [`+${event.xpAwarded} XP`] : []),
    ...(levelUp ? [`Level ${levelUp.to}`] : []),
    ...unlockedMilestones.map((label) => `Milestone: ${label}`),
    ...unlockedBadges.map((label) => `Badge: ${label}`),
    ...unlockedTracks.map((label) => `Track: ${label}`),
  ];

  const bodyParts: string[] = [];

  const title = (() => {
    switch (event.event) {
      case "lesson_completed":
        if (lesson) {
          bodyParts.push(`Deliverable locked: ${lesson.deliverable}.`);
        }
        return lesson ? `${lesson.title} complete` : "Lesson complete";
      case "starter_agent_deployed":
        bodyParts.push("A live assistant exists now. That is a real operating surface, not a fake unlock.");
        return "Deployment recorded";
      case "cost_threshold_set":
        bodyParts.push("Pico now has a visible line where spend should trigger operator attention.");
        return "Alert threshold configured";
      case "first_agent_run":
        bodyParts.push("The runtime answered a real prompt. You are past theory now.");
        return "First run verified";
      default:
        return titleCase(event.event.replace(/_/g, "-"));
    }
  })();

  if (levelUp) {
    bodyParts.push(`You crossed from level ${levelUp.from} to level ${levelUp.to}.`);
  }
  if (unlockedMilestones.length > 0) {
    bodyParts.push(`Unlocked ${unlockedMilestones.join(", ")}.`);
  }
  if (unlockedBadges.length > 0) {
    bodyParts.push(`Badge${unlockedBadges.length > 1 ? "s" : ""} earned: ${unlockedBadges.join(", ")}.`);
  }
  if (unlockedTracks.length > 0) {
    bodyParts.push(`Track${unlockedTracks.length > 1 ? "s" : ""} cleared: ${unlockedTracks.join(", ")}.`);
  }
  if (bodyParts.length === 0) {
    bodyParts.push("A real Pico outcome landed and moved your state forward.");
  }

  return {
    title,
    body: bodyParts.join(" "),
    chips,
    unlockedBadges,
    unlockedMilestones,
    unlockedTracks,
    levelUp,
  };
}

function getLeadingIncompleteTrack(completedLessonSlugs: string[], completedTrackIds: string[]) {
  const tracks = getPicoTrackProgress(completedLessonSlugs, completedTrackIds)
    .filter((track) => !track.completed)
    .sort((left, right) => {
      if (right.progressPercent !== left.progressPercent) {
        return right.progressPercent - left.progressPercent;
      }
      return right.completedLessons - left.completedLessons;
    });

  return tracks[0] ?? null;
}

function buildTrackMilestone(track: PicoTrackProgress): PicoNextMilestone {
  const lessonsLeft = Math.max(0, track.totalLessons - track.completedLessons);
  return {
    id: "first_track_finished",
    title: `Finish ${track.title}`,
    body: `${lessonsLeft} lesson${lessonsLeft === 1 ? "" : "s"} left before your first full Pico path is actually closed out.`,
    path: "/academy",
    actionLabel: "Finish the track",
  };
}

export function getNextMissingPicoMilestone(input: {
  completedLessonSlugs: string[];
  completedTrackIds: string[];
  milestones: string[];
}) {
  const milestoneSet = new Set(input.milestones);
  const nextLesson = getNextPicoLessonFromState(input.completedLessonSlugs);
  const leadingTrack = getLeadingIncompleteTrack(input.completedLessonSlugs, input.completedTrackIds);

  if (!milestoneSet.has("first_lesson_finished") && nextLesson) {
    return {
      id: "first_lesson_finished",
      title: "Record your first lesson",
      body: `Start with ${nextLesson.title} and only mark it done when the validation checks pass.`,
      path: `/academy/${nextLesson.slug}`,
      actionLabel: "Open the first lesson",
    } satisfies PicoNextMilestone;
  }

  if (!milestoneSet.has("first_track_finished") && leadingTrack) {
    return buildTrackMilestone(leadingTrack);
  }

  if (!milestoneSet.has("starter_agent_live")) {
    return {
      id: "starter_agent_live",
      title: "Deploy a live assistant",
      body: "Get one real runtime into Control so the academy stops being theory and starts leaving operational receipts.",
      path: "/control#starter-deploy",
      actionLabel: "Launch from Control",
    } satisfies PicoNextMilestone;
  }

  if (!milestoneSet.has("budget_guardrail_set")) {
    return {
      id: "budget_guardrail_set",
      title: "Configure your first alert threshold",
      body: "Set one visible spend line so Pico warns you before trust quietly drifts.",
      path: "/control#control-review",
      actionLabel: "Set the threshold",
    } satisfies PicoNextMilestone;
  }

  if (!milestoneSet.has("approval_guardrail_live")) {
    return {
      id: "approval_guardrail_live",
      title: "Put one risky action behind review",
      body: "Queue a real approval request so the control layer proves it can pause higher-risk actions on purpose.",
      path: "/control#control-review",
      actionLabel: "Create the approval",
    } satisfies PicoNextMilestone;
  }

  if (!milestoneSet.has("academy_completed") && nextLesson) {
    return {
      id: "academy_completed",
      title: "Finish the remaining curriculum",
      body: `The next honest move is ${nextLesson.title}. Keep chaining real outcomes until the academy is actually closed out.`,
      path: `/academy/${nextLesson.slug}`,
      actionLabel: "Open the next lesson",
    } satisfies PicoNextMilestone;
  }

  return null;
}
