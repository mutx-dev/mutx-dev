"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { picoLessons } from "@/lib/pico/course";

type PicoProgressState = {
  authenticated: boolean;
  plan: string | null;
  completedLessonSlugs: string[];
  completedCount: number;
  percentComplete: number;
  raw: unknown;
};

type PicoStateResult = {
  state: PicoProgressState;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markCompleted: (lessonSlug: string) => void;
};

const emptyState: PicoProgressState = {
  authenticated: false,
  plan: null,
  completedLessonSlugs: [],
  completedCount: 0,
  percentComplete: 0,
  raw: null,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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

function collectCompletedLessons(payload: unknown) {
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
    const lessonSlug = current.lesson_slug ?? current.lessonSlug ?? current.slug;
    const completedFlag = current.completed;
    if (
      typeof lessonSlug === "string" &&
      (completedFlag === true || event === "lesson.completed" || event === "pico.lesson.completed")
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

function normalizeState(payload: unknown, authenticated: boolean): PicoProgressState {
  const completedLessonSlugs = collectCompletedLessons(payload);
  const completedCount = completedLessonSlugs.length;
  const percentComplete = Math.round((completedCount / picoLessons.length) * 100);
  const plan = isRecord(payload) && typeof payload.plan === "string" ? payload.plan : null;

  return {
    authenticated,
    plan,
    completedLessonSlugs,
    completedCount,
    percentComplete,
    raw: payload,
  };
}

function extractErrorMessage(payload: unknown, fallback: string) {
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
        throw new Error(extractErrorMessage(payload, "Failed to load Pico progress"));
      }

      setState(normalizeState(payload, true));
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
