import { NextResponse } from "next/server";
import { setBroadcaster } from "@/lib/docs-sync";

// ── SSE client registry ────────────────────────────────
// Track each client with its heartbeat timer for clean teardown.

interface SSEClient {
  controller: ReadableStreamDefaultController;
  heartbeat: ReturnType<typeof setInterval>;
}

const clients = new Set<SSEClient>();

// Lazy broadcaster init — only register when this module loads (dev only)
let broadcasterRegistered = false;

function ensureBroadcaster() {
  if (broadcasterRegistered) return;
  broadcasterRegistered = true;

  setBroadcaster((files: string[]) => {
    const data = `data: ${JSON.stringify({ type: "docs-changed", files })}\n\n`;
    for (const client of clients) {
      try {
        client.controller.enqueue(data);
      } catch {
        // Dead client — clean up
        clearInterval(client.heartbeat);
        clients.delete(client);
      }
    }
  });
}

// GET /api/docs/events — SSE stream for dev live reload
export async function GET() {
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev) {
    return NextResponse.json(
      { error: "SSE only available in development" },
      { status: 404 }
    );
  }

  ensureBroadcaster();

  let clientRef: SSEClient | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        `data: ${JSON.stringify({ type: "connected" })}\n\n`
      );

      // Heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(
            `data: ${JSON.stringify({ type: "heartbeat" })}\n\n`
          );
        } catch {
          // Enqueue failed — client is dead
          clearInterval(heartbeat);
          clients.delete(clientRef!);
        }
      }, 30_000);

      clientRef = { controller, heartbeat };
      clients.add(clientRef);
    },
    cancel() {
      if (clientRef) {
        clearInterval(clientRef.heartbeat);
        clients.delete(clientRef);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export const dynamic = "force-dynamic";
