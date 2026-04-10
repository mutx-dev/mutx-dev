import { NextResponse } from "next/server";
import { setBroadcaster } from "@/lib/docs-sync";

// In-process client registry for SSE
const clients = new Set<ReadableStreamDefaultController>();

// Register our broadcaster so docs-sync can push events
setBroadcaster((files: string[]) => {
  const data = `data: ${JSON.stringify({ type: "docs-changed", files })}\n\n`;
  for (const client of clients) {
    try {
      client.enqueue(data);
    } catch {
      clients.delete(client);
    }
  }
});

// GET /api/docs/events — SSE stream for dev live reload
export async function GET() {
  const isDev = process.env.NODE_ENV === "development";

  // Only available in dev — production doesn't need live reload
  if (!isDev) {
    return NextResponse.json(
      { error: "SSE only available in development" },
      { status: 404 }
    );
  }

  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller);
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
          clearInterval(heartbeat);
          clients.delete(controller);
        }
      }, 30_000);

      // Cleanup on close
      // @ts-expect-error - ReadableStream controller doesn't have close callback in types
      controller._close = () => {
        clearInterval(heartbeat);
        clients.delete(controller);
      };
    },
    cancel(controller) {
      clients.delete(controller);
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
export const maxDuration = 300; // 5 min max for SSE
