"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Dev-only hook: connects to /api/docs/events SSE stream.
 * When docs files change on disk, triggers router.refresh()
 * so the page re-reads from disk (force-dynamic).
 *
 * Uses isMounted state to avoid conditional hook calls.
 * In production, the SSE endpoint returns 404 so this is a no-op.
 */
export function useDocsLiveReload() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only connect in browser after mount — SSE endpoint 404s in production
    if (!isMounted) return;

    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let alive = true;

    function connect() {
      if (!alive) return;
      es = new EventSource("/api/docs/events");

      es.addEventListener("message", (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "docs-changed") {
            router.refresh();
          }
        } catch {
          // ignore malformed events
        }
      });

      es.addEventListener("error", () => {
        es?.close();
        es = null;
        if (alive) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      });
    }

    connect();

    return () => {
      alive = false;
      es?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [router, isMounted]);
}
