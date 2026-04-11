"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { picoLessons } from "@/lib/pico/academy";

export type PicoTutorAccess = {
  plan: string | null;
  limit: number | null;
  remaining: number | null;
  used: number;
  limitReached: boolean;
  resetPolicy: string;
  note: string | null;
};

export type PicoLevelProgress = {
  currentLevel: number;
  currentLevelFloorXp: number;
  nextLevel: number | null;
  nextLevelTargetXp: number | null;
  xpIntoLevel: number;
  xpToNextLevel: number | null;
  progressPercent: number;
};

export type PicoRecentEvent = {
  event: string;
  xpAwarded: number;
  lessonId: string | null;
  trackId: string | null;
  badgeId: string | null;
  milestoneId: string | null;
  tutorSessions: number;
  createdAt: string | null;
  metadata: Record<string, unknown>;
};

export type PicoProgressState = {
  authenticated: boolean;
  plan: string | null;
  xpTotal: number;
  currentLevel: number;
  levelProgress: PicoLevelProgress;
  costThresholdUsd: number | null;
  approvalGateEnabled: boolean;
  completedLessonSlugs: string[];
  completedTrackIds: string[];
  badges: string[];
  milestones: string[];
  eventCounts: Record<string, number>;
  recentEvents: PicoRecentEvent[];
  tutorSessionsUsed: number;
  tutorAccess: PicoTutorAccess;
  completedCount: number;
  percentComplete: number;
  raw: unknown;
};

export type PicoStateResult = {
  state: PicoProgressState;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markCompleted: (lessonSlug: string) => void;
};

const emptyLevelProgress: PicoLevelProgress = {
  currentLevel: 1,
  currentLevelFloorXp: 0,
  nextLevel: 2,
  nextLevelTargetXp: 100,
  xpIntoLevel: 0,
  xpToNextLevel: 100,
  progressPercent: 0,
};

const emptyTutorAccess: PicoTutorAccess = {
  plan: null,
  limit: null,
  remaining: null,
  used: 0,
  limitReached: false,
  resetPolicy: "lifetime",
  note: null,
};

const emptyState: PicoProgressState = {
  authenticated: false,
  plan: null,
  xpTotal: 0,
  currentLevel: 1,
  levelProgress: emptyLevelProgress,
  costThresholdUsd: null,
  approvalGateEnabled: false,
  completedLessonSlugs: [],
  completedTrackIds: [],
  badges: [],
  milestones: [],
  eventCounts: {},
  recentEvents: [],
  tutorSessionsUsed: 0,
  tutorAccess: emptyTutorAccess,
  completedCount: 0,
  percentComplete: 0,
  raw: null,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toNonNegativeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, value);
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }

  return fallback;
}

function toOptionalNonNegativeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = toNonNegativeNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      if (isRecord(item)) {
        const slug = item.lesson_slug ?? item.lessonSlug ?? item.slug ?? item.id;
        if (typeof slug === "string") {
          const status = item.status;
          const completed = item.completed;
          if (
            completed === true ||
            status === "completed" ||
            status === "done" ||
            status === "passed" ||
            status === undefined
          ) {
            return slug;
          }
        }
      }

      return null;
    })
    .filter((item): item is string => Boolean(item));
}

export function collectCompletedLessons(payload: unknown) {
  const completed = new Set<string>();
  const queue: unknown[] = [payload];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    if (Array.isArray(current)) {
      for (const item of current) {
        queue.push(item);
      }
      continue;
    }

    if (!isRecord(current)) {
      continue;
    }

    for (const key of [
      "completed_lessons",
      "completedLessons",
      "lesson_slugs",
      "lessonSlugs",
      "lessons",
      "items",
    ]) {
      for (const slug of toStringArray(current[key])) {
        completed.add(slug);
      }
    }

    const event = current.event ?? current.type;
    const lessonSlug =
      current.lesson_id ?? current.lessonId ?? current.lesson_slug ?? current.lessonSlug ?? current.slug;
    const completedFlag = current.completed;
    if (
      typeof lessonSlug === "string" &&
      (
        completedFlag === true ||
        event === "lesson.completed" ||
        event === "pico.lesson.completed" ||
        event === "lesson_completed"
      )
    ) {
      completed.add(lessonSlug);
    }

    for (const value of Object.values(current)) {
      if (isRecord(value) || Array.isArray(value)) {
        queue.push(value);
      }
    }
  }

  return Array.from(completed).filter((slug) => picoLessons.some((lesson) => lesson.slug === slug));
}

function normalizeEventCounts(value: unknown): Record<string, number> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, count]) => [key, Math.floor(toNonNegativeNumber(count, 0))]),
  );
}

function normalizeRecentEvents(value: unknown): PicoRecentEvent[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      return {
        event: typeof item.event === "string" ? item.event : "unknown",
        xpAwarded: Math.floor(toNonNegativeNumber(item.xp_awarded, 0)),
        lessonId: typeof item.lesson_id === "string" ? item.lesson_id : null,
        trackId: typeof item.track_id === "string" ? item.track_id : null,
        badgeId: typeof item.badge_id === "string" ? item.badge_id : null,
        milestoneId: typeof item.milestone_id === "string" ? item.milestone_id : null,
        tutorSessions: Math.floor(toNonNegativeNumber(item.tutor_sessions, 0)),
        createdAt: typeof item.created_at === "string" ? item.created_at : null,
        metadata: isRecord(item.metadata) ? item.metadata : {},
      } satisfies PicoRecentEvent;
    })
    .filter((item): item is PicoRecentEvent => Boolean(item));
}

function normalizeTutorAccess(
  payload: unknown,
  plan: string | null,
  tutorSessionsUsed: number,
): PicoTutorAccess {
  const tutorAccess = isRecord(payload) && isRecord(payload.tutor_access) ? payload.tutor_access : null;
  return {
    plan: typeof tutorAccess?.plan === "string" ? tutorAccess.plan : plan,
    limit: toOptionalNonNegativeNumber(tutorAccess?.limit),
    remaining: toOptionalNonNegativeNumber(tutorAccess?.remaining),
    used: Math.floor(toNonNegativeNumber(tutorAccess?.used, tutorSessionsUsed)),
    limitReached: tutorAccess?.limit_reached === true,
    resetPolicy:
      typeof tutorAccess?.reset_policy === "string" && tutorAccess.reset_policy.trim().length > 0
        ? tutorAccess.reset_policy
        : "lifetime",
    note: typeof tutorAccess?.note === "string" ? tutorAccess.note : null,
  };
}

function normalizeLevelProgress(
  payload: unknown,
  currentLevel: number,
  xpTotal: number,
): PicoLevelProgress {
  const levelProgress = isRecord(payload) && isRecord(payload.level_progress) ? payload.level_progress : null;
  const nextLevel =
    levelProgress && (typeof levelProgress.next_level === "number" || typeof levelProgress.next_level === "string")
      ? Math.max(1, Math.floor(toNonNegativeNumber(levelProgress.next_level, currentLevel + 1)))
      : null;

  return {
    currentLevel: Math.max(
      1,
      Math.floor(toNonNegativeNumber(levelProgress?.current_level, currentLevel)),
    ),
    currentLevelFloorXp: Math.floor(
      toNonNegativeNumber(levelProgress?.current_level_floor_xp, emptyLevelProgress.currentLevelFloorXp),
    ),
    nextLevel,
    nextLevelTargetXp: toOptionalNonNegativeNumber(levelProgress?.next_level_target_xp),
    xpIntoLevel: Math.floor(toNonNegativeNumber(levelProgress?.xp_into_level, xpTotal)),
    xpToNextLevel: toOptionalNonNegativeNumber(levelProgress?.xp_to_next_level),
    progressPercent: Math.min(100, Math.floor(toNonNegativeNumber(levelProgress?.progress_percent, 0))),
  };
}

export function normalizePicoState(payload: unknown, authenticated: boolean): PicoProgressState {
  const completedLessonSlugs = collectCompletedLessons(payload);
  const completedCount = completedLessonSlugs.length;
  const percentComplete = Math.round((completedCount / picoLessons.length) * 100);
  const plan = isRecord(payload) && typeof payload.plan === "string" ? payload.plan : null;
  const xpTotal = Math.floor(
    isRecord(payload) ? toNonNegativeNumber(payload.xp_total, 0) : 0,
  );
  const currentLevel = Math.max(
    1,
    Math.floor(isRecord(payload) ? toNonNegativeNumber(payload.current_level, 1) : 1),
  );
  const tutorSessionsUsed = Math.floor(
    isRecord(payload) ? toNonNegativeNumber(payload.tutor_sessions_used, 0) : 0,
  );

  return {
    authenticated,
    plan,
    xpTotal,
    currentLevel,
    levelProgress: normalizeLevelProgress(payload, currentLevel, xpTotal),
    costThresholdUsd: isRecord(payload) ? toOptionalNonNegativeNumber(payload.cost_threshold_usd) : null,
    approvalGateEnabled: isRecord(payload) && payload.approval_gate_enabled === true,
    completedLessonSlugs,
    completedTrackIds:
      isRecord(payload) ? toStringArray(payload.completed_tracks ?? payload.completedTracks) : [],
    badges: isRecord(payload) ? toStringArray(payload.badges) : [],
    milestones: isRecord(payload) ? toStringArray(payload.milestones) : [],
    eventCounts: isRecord(payload) ? normalizeEventCounts(payload.event_counts) : {},
    recentEvents: isRecord(payload) ? normalizeRecentEvents(payload.recent_events) : [],
    tutorSessionsUsed,
    tutorAccess: normalizeTutorAccess(payload, plan, tutorSessionsUsed),
    completedCount,
    percentComplete,
    raw: payload,
  };
}

export function extractPicoErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }

  if (!isRecord(payload)) {
    return fallback;
  }

  for (const key of ["detail", "message"]) {
    const value = payload[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  const error = payload.error;
  if (isRecord(error) && typeof error.message === "string") {
    return error.message;
  }

  return fallback;
}

export function usePicoState(): PicoStateResult {
  const [state, setState] = useState<PicoProgressState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/pico/state", { cache: "no-store" });
      const payload = await response.json().catch(() => null);

      if (response.status === 401) {
        setState(emptyState);
        return;
      }

      if (!response.ok) {
        throw new Error(extractPicoErrorMessage(payload, "Failed to load Pico progress"));
      }

      setState(normalizePicoState(payload, true));
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Failed to load Pico progress",
      );
      setState(emptyState);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const markCompleted = useCallback((lessonSlug: string) => {
    setState((current) => {
      if (current.completedLessonSlugs.includes(lessonSlug)) {
        return current;
      }

      const completedLessonSlugs = [...current.completedLessonSlugs, lessonSlug];
      const completedCount = completedLessonSlugs.length;
      return {
        ...current,
        authenticated: true,
        completedLessonSlugs,
        completedCount,
        percentComplete: Math.round((completedCount / picoLessons.length) * 100),
      };
    });
  }, []);

  return useMemo(
    () => ({ state, loading, error, refresh, markCompleted }),
    [state, loading, error, refresh, markCompleted],
  );
}
