import { NextRequest, NextResponse } from "next/server";
import {
  syncDocsFromGit,
  getSyncStatus,
  getSyncLog,
  hasGit,
} from "@/lib/docs-sync";
import * as crypto from "crypto";

function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")}`;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

// POST /api/docs/sync — trigger a git pull + revalidation
export async function POST(request: NextRequest) {
  const bodyText = await request.text();

  // GitHub webhook push event
  const githubEvent = request.headers.get("x-github-event");
  const signature = request.headers.get("x-hub-signature-256");
  const webhookSecret = process.env.DOCS_SYNC_WEBHOOK_SECRET;

  if (githubEvent === "push" && webhookSecret && signature) {
    if (!verifySignature(bodyText, signature, webhookSecret)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    let payload: { ref?: string };
    try {
      payload = JSON.parse(bodyText);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const ref = payload.ref;
    if (!ref?.endsWith("/main") && !ref?.endsWith("/master")) {
      return NextResponse.json({
        skipped: true,
        reason: `Push to ${ref}, not main`,
      });
    }

    // No git in container — content is baked at deploy time
    if (!hasGit()) {
      return NextResponse.json({
        success: true,
        pulled: false,
        mode: "deploy-time",
        message:
          "Content is baked at deploy time. Push triggers Railway redeploy automatically.",
        commit: null,
        changedFiles: [],
        docRoutes: [],
      });
    }

    const result = await syncDocsFromGit("webhook");
    return NextResponse.json(result);
  }

  // Manual trigger — allowed in dev or with bearer token
  const isDev = process.env.NODE_ENV === "development";
  const auth = request.headers.get("authorization");
  const syncToken = process.env.DOCS_SYNC_TOKEN;

  if (!isDev && syncToken) {
    if (auth !== `Bearer ${syncToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!hasGit()) {
    return NextResponse.json({
      success: true,
      pulled: false,
      mode: "deploy-time",
      message: "Content is baked at deploy time. No git available.",
      commit: null,
      changedFiles: [],
      docRoutes: [],
    });
  }

  const result = await syncDocsFromGit("manual");
  return NextResponse.json(result);
}

// GET /api/docs/sync — check sync status + recent log
export async function GET() {
  const status = getSyncStatus();
  const log = getSyncLog();
  return NextResponse.json({
    ...status,
    mode: hasGit() ? "git-sync" : "deploy-time",
    recentLog: log.slice(-10),
  });
}

export const dynamic = "force-dynamic";
