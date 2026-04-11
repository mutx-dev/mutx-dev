import { headers } from "next/headers";

import { AuthPage } from "@/components/auth/AuthPage";
import { buildPicoPath, getPicoBasePath } from "@/lib/pico/routing";

export default async function PicoLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const nextPath = Array.isArray(params.next) ? params.next[0] : params.next;
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const routePrefix = getPicoBasePath(host);
  const defaultNextPath = buildPicoPath(routePrefix, "/start");

  return (
    <AuthPage
      mode="login"
      nextPath={nextPath ?? defaultNextPath}
      routePrefix={routePrefix}
      contentOverride={{
        eyebrow: "Pico sign-in",
        title: "Sign in and return to Pico start.",
        description:
          "Use the hosted auth flow, then continue through the shipped Pico checklist: academy, starter deploy, control, and grounded support.",
        subheading: "Sign in and keep your Pico lesson progress and operator state synced.",
      }}
    />
  );
}