import type { ReactNode } from "react";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";

import { PicoPathProvider } from "@/components/pico/PicoPathProvider";
import { routing } from "@/i18n/routing";
import { getPicoBasePath } from "@/lib/pico/routing";

type Props = {
  children: ReactNode;
};

export default async function PicoLayout({ children }: Props) {
  const resolvedLocale = await getLocale();
  const locale = routing.locales.includes(resolvedLocale as (typeof routing.locales)[number])
    ? resolvedLocale
    : "en";
  const messages = await getMessages();
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const basePath = getPicoBasePath(host);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <PicoPathProvider basePath={basePath}>{children}</PicoPathProvider>
    </NextIntlClientProvider>
  );
}
