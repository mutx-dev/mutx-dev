import { NextRequest, NextResponse } from "next/server";

import {
  applyAuthCookies,
  authenticatedFetch,
  getApiBaseUrl,
  hasAuthSession,
} from "@/app/api/_lib/controlPlane";
import { unauthorized, withErrorHandling } from "@/app/api/_lib/errors";


export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    if (!hasAuthSession(request)) {
      return unauthorized();
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const event = searchParams.get("event");
    const success = searchParams.get("success");
    const limit = searchParams.get("limit") || "50";

    const queryParams = new URLSearchParams();
    if (event) queryParams.set("event", event);
    if (success) queryParams.set("success", success);
    queryParams.set("limit", limit);

    const { response, tokenRefreshed, refreshedTokens } = await authenticatedFetch(
      request,
      `${getApiBaseUrl()}/v1/webhooks/${id}/deliveries?${queryParams.toString()}`,
      {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }
    );

    const payload = await response.json().catch(() => ({}));
    const nextResponse = response.ok
      ? NextResponse.json({ deliveries: payload }, { status: response.status })
      : NextResponse.json(
          { error: payload.detail || "Failed to fetch webhook deliveries" },
          { status: response.status }
        );

    if (tokenRefreshed && refreshedTokens) {
      applyAuthCookies(nextResponse, request, refreshedTokens);
    }

    return nextResponse;
  })(request);
}
