import { NextResponse } from "next/server";

import {
  MUTX_GITHUB_RELEASES_URL,
  fetchLatestStableDesktopRelease,
} from "@/lib/desktopRelease";

export const dynamic = "force-dynamic";

export async function GET() {
  const release = await fetchLatestStableDesktopRelease();
  return NextResponse.redirect(release?.assets.arm64Dmg ?? release?.htmlUrl ?? MUTX_GITHUB_RELEASES_URL);
}

