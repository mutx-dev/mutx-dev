"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Dev-only hook: connects to /api/docs/events SSE stream.
 * When docs files change on disk, triggers router.refresh()
 * so the page re-reads from disk (force-dynamic).
 */
export function useDocsLiveReload() {
  if (process.env.NODE_ENV !== "development") return;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const router = useRouter();

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
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
        // Reconnect after 3s
        reconnectTimer = setTimeout(connect, 3000);
      });
    }

    connect();

    return () => {
      es?.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [router]);
}
