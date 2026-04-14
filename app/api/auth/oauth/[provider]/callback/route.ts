import { NextRequest, NextResponse } from "next/server";

import {
  applyAuthCookies,
  getApiBaseUrl,
  getCookieDomain,
  shouldUseSecureCookies,
} from "@/app/api/_lib/controlPlane";
import {
  getDefaultRedirectPathForHost,
  resolveRedirectPath,
} from "@/lib/auth/redirects";

const OAUTH_COOKIE_PREFIX = "mutx_oauth";
const SUPPORTED_PROVIDERS = new Set(["google", "github", "discord"]);

function resolveProvider(value: string) {
  return SUPPORTED_PROVIDERS.has(value) ? value : null;
}

function resolveIntent(value: string | null) {
  return value === "register" ? "register" : "login";
}

function clearOAuthCookies(response: NextResponse, request: NextRequest) {
  const secure = shouldUseSecureCookies(request);
  const domain = getCookieDomain(request);

  for (const suffix of ["state", "next", "intent"]) {
    response.cookies.set(`${OAUTH_COOKIE_PREFIX}_${suffix}`, "", {
      httpOnly: true,
      sameSite: "lax",
      secure,
      domain,
      path: "/",
      maxAge: 0,
    });
  }
}

function buildAuthRedirect(
  request: NextRequest,
  intent: string,
  nextPath: string,
  error: string,
) {
  const url = new URL(`/${intent}`, request.nextUrl.origin);
  url.searchParams.set("next", nextPath);
  url.searchParams.set("error", error);
  return url;
}

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
): Promise<NextResponse> {
  const { provider: rawProvider } = await context.params;
  const provider = resolveProvider(rawProvider);
  const intent = resolveIntent(
    request.cookies.get(`${OAUTH_COOKIE_PREFIX}_intent`)?.value ?? null,
  );
  const nextPath = resolveRedirectPath(
    request.cookies.get(`${OAUTH_COOKIE_PREFIX}_next`)?.value ??
      request.nextUrl.searchParams.get("next"),
    getDefaultRedirectPathForHost(request.nextUrl.hostname),
  );

  const fail = (message: string) => {
    const response = NextResponse.redirect(
      buildAuthRedirect(request, intent, nextPath, message),
    );
    clearOAuthCookies(response, request);
    return response;
  };

  if (!provider) {
    return fail("Unsupported OAuth provider.");
  }

  const providerError =
    request.nextUrl.searchParams.get("error_description") ??
    request.nextUrl.searchParams.get("error");
  if (providerError) {
    return fail(providerError);
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get(
    `${OAUTH_COOKIE_PREFIX}_state`,
  )?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return fail("OAuth session expired. Start sign-in again.");
  }

  const redirectUri = new URL(
    `/api/auth/oauth/${provider}/callback`,
    request.nextUrl.origin,
  ).toString();
  const response = await fetch(
    `${getApiBaseUrl()}/v1/auth/oauth/${provider}/exchange`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    },
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    return fail(
      typeof payload?.detail === "string"
        ? payload.detail
        : "OAuth sign-in failed. Try another provider or use email.",
    );
  }

  const successResponse = NextResponse.redirect(
    new URL(nextPath, request.nextUrl.origin),
  );
  applyAuthCookies(successResponse, request, payload);
  clearOAuthCookies(successResponse, request);
  return successResponse;
}
