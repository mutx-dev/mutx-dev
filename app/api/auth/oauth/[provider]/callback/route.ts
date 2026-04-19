import { NextRequest, NextResponse } from "next/server";

import {
  applyAuthCookies,
  getApiBaseUrl,
  getCookieDomain,
  shouldUseSecureCookies,
} from "@/app/api/_lib/controlPlane";
import { normalizePicoLocale } from "@/lib/pico/locale";
import {
  getDefaultRedirectPathForHost,
  resolveRedirectPath,
} from "@/lib/auth/redirects";

const OAUTH_COOKIE_PREFIX = "mutx_oauth";
const SUPPORTED_PROVIDERS = new Set(["google", "github", "discord", "apple"]);

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

function getRequestHeader(request: NextRequest, name: string) {
  return request.headers?.get?.(name) ?? null;
}

function getPublicOrigin(request: NextRequest): string {
  const forwardedHost =
    getRequestHeader(request, "x-forwarded-host") ||
    getRequestHeader(request, "host");
  const forwardedProto =
    getRequestHeader(request, "x-forwarded-proto") ||
    request.nextUrl.protocol.replace(":", "") ||
    "https";
  return forwardedHost
    ? `${forwardedProto}://${forwardedHost.split(",")[0].trim()}`
    : request.nextUrl.origin;
}

function buildAuthRedirect(
  request: NextRequest,
  intent: string,
  nextPath: string,
  error: string,
) {
  const url = new URL(`/${intent}`, getPublicOrigin(request));
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

  const redirectUri = `${getPublicOrigin(request)}/api/auth/oauth/${provider}/callback`;
  const preferredLocale = normalizePicoLocale(
    request.cookies.get("NEXT_LOCALE")?.value ?? null,
  );
  const response = await fetch(
    `${getApiBaseUrl()}/v1/auth/oauth/${provider}/exchange`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        redirect_uri: redirectUri,
        ...(preferredLocale ? { preferred_locale: preferredLocale } : {}),
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
    new URL(nextPath, getPublicOrigin(request)),
  );
  applyAuthCookies(successResponse, request, payload);
  clearOAuthCookies(successResponse, request);
  return successResponse;
}

/**
 * Apple Sign In uses `response_mode=form_post`, which means the callback
 * arrives as a POST with the `code` and `state` in the request body
 * (application/x-www-form-urlencoded) instead of query parameters.
 *
 * This handler extracts those values from the form body and performs the
 * same exchange flow as the GET handler above.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
): Promise<NextResponse> {
  const { provider: rawProvider } = await context.params;
  const provider = resolveProvider(rawProvider);
  const intent = resolveIntent(
    request.cookies.get(`${OAUTH_COOKIE_PREFIX}_intent`)?.value ?? null,
  );
  const nextPath = resolveRedirectPath(
    request.cookies.get(`${OAUTH_COOKIE_PREFIX}_next`)?.value ?? null,
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

  // Parse form body — Apple sends code + state as form-encoded POST
  const formData = await request.formData();
  const providerError =
    formData.get("error_description")?.toString() ??
    formData.get("error")?.toString();
  if (providerError) {
    return fail(providerError);
  }

  const code = formData.get("code")?.toString();
  const state = formData.get("state")?.toString();
  const storedState = request.cookies.get(
    `${OAUTH_COOKIE_PREFIX}_state`,
  )?.value;

  if (!code || !state || !storedState || state !== storedState) {
    return fail("OAuth session expired. Start sign-in again.");
  }

  const redirectUri = `${getPublicOrigin(request)}/api/auth/oauth/${provider}/callback`;
  const preferredLocale = normalizePicoLocale(
    request.cookies.get("NEXT_LOCALE")?.value ?? null,
  );
  const response = await fetch(
    `${getApiBaseUrl()}/v1/auth/oauth/${provider}/exchange`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        redirect_uri: redirectUri,
        ...(preferredLocale ? { preferred_locale: preferredLocale } : {}),
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
    new URL(nextPath, getPublicOrigin(request)),
  );
  applyAuthCookies(successResponse, request, payload);
  clearOAuthCookies(successResponse, request);
  return successResponse;
}
