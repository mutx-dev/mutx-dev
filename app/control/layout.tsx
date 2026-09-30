import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import { appFontVariables } from "@/app/fonts/app";
import { ControlDemoStateProvider } from "@/components/dashboard/demo/ControlDemoState";
import { ControlErrorBoundary } from "@/components/dashboard/demo/ControlErrorBoundary";
import { DemoViewportLock } from "@/components/dashboard/demo/DemoViewportLock";
import { buildPageMetadata, getAppUrl } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl()),
  ...buildPageMetadata({
    title: "MUTX Product Demo",
    description: "Explore sample agent runs, inspect tool calls, and see where an operator reviews each action.",
    path: "/control",
    host: getAppUrl(),
    siteName: "MUTX",
    badge: "PRODUCT DEMO",
  }),
  robots: {
    index: true,
    follow: true,
    nocache: false,
  },
  title: "MUTX Product Demo",
  description: "Explore sample agent runs, inspect tool calls, and see where an operator reviews each action.",
  keywords: [
    "agent runs",
    "tool call review",
    "operator decisions",
    "agent environments",
  ],
};

export default async function AppDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ControlErrorBoundary>
        <DemoViewportLock>
          <ControlDemoStateProvider>
            <div className={`${appFontVariables} h-full overflow-hidden font-(--font-site-body)`}>
              {children}
            </div>
          </ControlDemoStateProvider>
        </DemoViewportLock>
      </ControlErrorBoundary>
    </NextIntlClientProvider>
  );
}
