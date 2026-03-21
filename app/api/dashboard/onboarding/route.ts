import { NextRequest } from "next/server";

import { getApiBaseUrl } from "@/app/api/_lib/controlPlane";
import { withErrorHandling } from "@/app/api/_lib/errors";
import { proxyJson } from "@/app/api/_lib/proxy";

const API_BASE_URL = getApiBaseUrl();

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return withErrorHandling(async () => {
    const query = request.nextUrl.search;
    return proxyJson(
      request,
      `${API_BASE_URL}/v1/onboarding${query}`,
      { fallbackMessage: "Failed to fetch onboarding state" },
    );
  })(request);
}

