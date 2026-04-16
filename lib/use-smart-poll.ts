"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Connection state for WS/SSE pause logic.
 * Until MUTX has a real-time layer, consumers pass { isConnected: false, sseConnected: false }
 * or omit it entirely — the hook degrades gracefully and always polls.
 */
export interface ConnectionState {
  isConnected: boolean;
  sseConnected: boolean;
}

export interface SmartPollOptions {
  /** Pause polling when WebSocket is connected (data comes via WS anyway) */
  pauseWhenConnected?: boolean;
  /** Pause polling when WebSocket is disconnected (no point polling if server is down) */
  pauseWhenDisconnected?: boolean;
  /** Pause polling when SSE is connected (real-time events replace polling) */
  pauseWhenSseConnected?: boolean;
  /** Enable interval backoff on error (0.5x increment up to maxBackoffMultiplier) */
  backoff?: boolean;
  /** Maximum backoff multiplier (default: 3x) */
  maxBackoffMultiplier?: number;
  /** Only poll when true */
  enabled?: boolean;
  /**
   * External connection state for WS/SSE pause logic.
   * Defaults to { isConnected: false, sseConnected: false } (always poll).
   * Will be replaced by Zustand store connection once #3689 lands.
   */
  connectionState?: ConnectionState;
}

/**
 * Visibility-aware polling hook that pauses when the browser tab is hidden
 * and resumes immediately when the tab becomes visible again.
 *
 * Always fires an initial fetch on mount (regardless of SSE/WS state)
 * to bootstrap component data. Subsequent polls respect pause options.
 *
 * Returns a function to manually trigger an immediate poll.
 *
 * @example
 * // Poll agents every 10s, pause when SSE connected
 * useSmartPoll(() => fetchAgents(), 10000, { pauseWhenSseConnected: true, connectionState })
 *
 * @example
 * // Poll logs every 5s with backoff, only when enabled
 * useSmartPoll(() => fetchLogs(), 5000, { backoff: true, enabled: showLogs })
 *
 * @example
 * // Poll everything every 30s, pause when WS connected
 * const refetch = useSmartPoll(refreshAll, 30000, { pauseWhenConnected: true, connectionState })
 */
export function useSmartPoll(
  callback: () => void | Promise<void>,
  intervalMs: number,
  options: SmartPollOptions = {}
): () => void {
  const {
    pauseWhenConnected = false,
    pauseWhenDisconnected = false,
    pauseWhenSseConnected = false,
    backoff = false,
    maxBackoffMultiplier = 3,
    enabled = true,
    connectionState = { isConnected: false, sseConnected: false },
  } = options;

  const callbackRef = useRef(callback);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined
  );
  const backoffMultiplierRef = useRef(1);
  const isVisibleRef = useRef(true);
  const initialFiredRef = useRef(false);

  // Keep callback ref current without re-triggering the effect
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Determine if ongoing polling should be active
  const shouldPoll = useCallback(() => {
    if (!enabled) return false;
    if (!isVisibleRef.current) return false;
    if (pauseWhenConnected && connectionState.isConnected) return false;
    if (pauseWhenDisconnected && !connectionState.isConnected) return false;
    if (pauseWhenSseConnected && connectionState.sseConnected) return false;
    return true;
  }, [
    enabled,
    pauseWhenConnected,
    pauseWhenDisconnected,
    pauseWhenSseConnected,
    connectionState.isConnected,
    connectionState.sseConnected,
  ]);

  const fire = useCallback(() => {
    if (!shouldPoll()) return;
    const result = callbackRef.current();
    if (result instanceof Promise) {
      result.catch(() => {
        if (backoff) {
          backoffMultiplierRef.current = Math.min(
            backoffMultiplierRef.current + 0.5,
            maxBackoffMultiplier
          );
        }
      });
    }
  }, [shouldPoll, backoff, maxBackoffMultiplier]);

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!shouldPoll()) return;

    const effectiveInterval = backoff
      ? intervalMs * backoffMultiplierRef.current
      : intervalMs;

    intervalRef.current = setInterval(() => {
      if (shouldPoll()) {
        callbackRef.current();
      }
    }, effectiveInterval);
  }, [intervalMs, shouldPoll, backoff]);

  // Main effect: set up polling + visibility listener
  useEffect(() => {
    // Always fire initial fetch to bootstrap data, even if SSE/WS is connected.
    // SSE delivers events (agent.updated, etc.) but not the full initial state.
    if (!initialFiredRef.current && enabled) {
      initialFiredRef.current = true;
      callbackRef.current();
    }

    // Start interval polling (respects shouldPoll for ongoing polls)
    startInterval();

    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === "visible";

      if (isVisibleRef.current) {
        // Tab became visible: fire immediately, reset backoff, restart interval
        backoffMultiplierRef.current = 1;
        fire();
        startInterval();
      } else {
        // Tab hidden: stop polling
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = undefined;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };
  }, [fire, startInterval, enabled]);

  // Restart interval when connection state changes (WS or SSE)
  useEffect(() => {
    startInterval();
  }, [connectionState.isConnected, connectionState.sseConnected, startInterval]);

  // Return manual trigger
  return fire;
}
