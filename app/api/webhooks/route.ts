import { NextRequest, NextResponse } from "next/server";
import {
  applyAuthCookies,
  authenticatedFetch,
  getApiBaseUrl,
  hasAuthSession,
} from "@/app/api/_lib/controlPlane";
import { validateRequest, schemas } from "@/app/api/_lib/validation";
import { unauthorized, withErrorHandling } from "@/app/api/_lib/errors";


export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async () => {
    if (!hasAuthSession(request)) {
      return unauthorized();
    }

    const { response, tokenRefreshed, refreshedTokens } = await authenticatedFetch(
      request,
      `${getApiBaseUrl()}/v1/webhooks`,
      {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }
    );

    const payload = await response.json().catch(() => ({}));
    const nextResponse = response.ok
      ? NextResponse.json({
          webhooks: Array.isArray(payload) ? payload : payload?.items ?? [],
          total: payload?.total,
          skip: payload?.skip,
          limit: payload?.limit,
        })
      : NextResponse.json(
          { error: payload.detail || "Failed to fetch webhooks" },
          { status: response.status }
        );

    if (tokenRefreshed && refreshedTokens) {
      applyAuthCookies(nextResponse, request, refreshedTokens);
    }

    return nextResponse;
  })(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return withErrorHandling(async (_req: Request) => {
    if (!hasAuthSession(request)) {
      return unauthorized();
    }

    const validation = await validateRequest(schemas.webhookCreate, request);
    if (!validation.success) {
      return validation.response;
    }

    const { response, tokenRefreshed, refreshedTokens } = await authenticatedFetch(
      request,
      `${getApiBaseUrl()}/v1/webhooks`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
        cache: "no-store",
      }
    );

    const payload = await response.json().catch(() => ({}));
    const nextResponse = response.ok
      ? NextResponse.json(payload, { status: response.status })
      : NextResponse.json(
          { error: payload.detail || "Failed to create webhook" },
          { status: response.status }
        );

    if (tokenRefreshed && refreshedTokens) {
      applyAuthCookies(nextResponse, request, refreshedTokens);
    }

    return nextResponse;
  })(request);
}
