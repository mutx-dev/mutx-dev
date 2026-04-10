import { headers } from "next/headers";

import { AuthPage } from "@/components/auth/AuthPage";
import { getPicoBasePath } from "@/lib/pico/routing";

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

  return (
    <AuthPage
      mode="login"
      nextPath={nextPath ?? `${routePrefix}/academy`}
      routePrefix={routePrefix}
      contentOverride={{
        eyebrow: "Pico sign-in",
        title: "Sign in and return to the Pico academy.",
        description:
          "Use the same hosted auth flow, then continue into Pico lessons, control, and support instead of a waitlist shell.",
        subheading: "Sign in and keep your Pico lesson progress synced.",
      }}
    />
  );
}