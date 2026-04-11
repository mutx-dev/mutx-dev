import { headers } from "next/headers";

import { AuthPage } from "@/components/auth/AuthPage";
import { buildPicoPath, getPicoBasePath } from "@/lib/pico/routing";

export default async function PicoRegisterPage({
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
      mode="register"
      nextPath={nextPath ?? defaultNextPath}
      routePrefix={routePrefix}
      contentOverride={{
        eyebrow: "Pico access",
        title: "Create your Pico account and return to Pico start.",
        description:
          "Registration still uses the hosted auth API, but the first destination is the shipped Pico checklist: academy, starter deploy, control, and grounded support.",
        subheading: "Create an account and start saving Pico progress and control state.",
      }}
    />
  );
}