import { randomBytes } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  getApiBaseUrl,
  getCookieDomain,
  shouldUseSecureCookies,
} from "@/app/api/_lib/controlPlane";
import { resolveRedirectPath } from "@/lib/auth/redirects";

const OAUTH_COOKIE_PREFIX = "mutx_oauth";
const OAUTH_MAX_AGE_SECONDS = 60 * 10;
const SUPPORTED_PROVIDERS = new Set(["google", "github", "discord"]);

function resolveProvider(value: string) {
  return SUPPORTED_PROVIDERS.has(value) ? value : null;
}

function resolveIntent(value: string | null) {
  return value === "register" ? "register" : "login";
}

function setOAuthCookie(
  response: NextResponse,
  request: NextRequest,
  name: string,
  value: string,
) {
  response.cookies.set(name, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(request),
    domain: getCookieDomain(request),
    path: "/",
    maxAge: OAUTH_MAX_AGE_SECONDS,
  });
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
  const intent = resolveIntent(request.nextUrl.searchParams.get("intent"));
  const nextPath = resolveRedirectPath(
    request.nextUrl.searchParams.get("next"),
  );

  if (!provider) {
    return NextResponse.redirect(
      buildAuthRedirect(
        request,
        intent,
        nextPath,
        "Unsupported OAuth provider.",
      ),
    );
  }

  const redirectUri = new URL(
    `/api/auth/oauth/${provider}/callback`,
    request.nextUrl.origin,
  ).toString();
  const state = randomBytes(24).toString("base64url");
  const authorizeUrl = new URL(
    `${getApiBaseUrl()}/v1/auth/oauth/${provider}/authorize`,
  );
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", state);

  const response = await fetch(authorizeUrl, { cache: "no-store" });
  const payload = await response.json().catch(() => null);

  if (!response.ok || typeof payload?.authorization_url !== "string") {
    return NextResponse.redirect(
      buildAuthRedirect(
        request,
        intent,
        nextPath,
        typeof payload?.detail === "string"
          ? payload.detail
          : "OAuth is unavailable right now.",
      ),
    );
  }

  const redirectResponse = NextResponse.redirect(payload.authorization_url);
  setOAuthCookie(
    redirectResponse,
    request,
    `${OAUTH_COOKIE_PREFIX}_state`,
    state,
  );
  setOAuthCookie(
    redirectResponse,
    request,
    `${OAUTH_COOKIE_PREFIX}_next`,
    nextPath,
  );
  setOAuthCookie(
    redirectResponse,
    request,
    `${OAUTH_COOKIE_PREFIX}_intent`,
    intent,
  );
  return redirectResponse;
}
