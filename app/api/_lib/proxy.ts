import { NextRequest, NextResponse } from "next/server";

import {
  applyAuthCookies,
  authenticatedFetch,
  hasAuthSession,
} from "@/app/api/_lib/controlPlane";
import { unauthorized } from "@/app/api/_lib/errors";

type ProxyJsonOptions = RequestInit & {
  fallbackMessage?: string;
};

export async function proxyJson(
  request: NextRequest,
  url: string,
  options: ProxyJsonOptions = {},
): Promise<NextResponse> {
  if (!hasAuthSession(request)) {
    return unauthorized();
  }

  const { fallbackMessage = "Request failed", ...fetchOptions } = options;
  const { response, tokenRefreshed, refreshedTokens } = await authenticatedFetch(
    request,
    url,
    {
      ...fetchOptions,
      cache: fetchOptions.cache ?? "no-store",
    },
  );

  let nextResponse: NextResponse;

  if (response.status === 204) {
    nextResponse = new NextResponse(null, { status: 204 });
  } else {
    const payload = await response
      .json()
      .catch(() => ({ detail: fallbackMessage }));
    nextResponse = NextResponse.json(payload, { status: response.status });
  }

  if (tokenRefreshed && refreshedTokens) {
    applyAuthCookies(nextResponse, request, refreshedTokens);
  }

  return nextResponse;
}
