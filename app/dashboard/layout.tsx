import type { Metadata } from "next";

import { appFontVariables } from "@/app/fonts/app";
import { ErrorBoundary } from "@/components/app/ErrorBoundary";
import { DesktopJobProvider } from "@/components/desktop/useDesktopJob";
import { DesktopRouteListener } from "@/components/desktop/DesktopRouteListener";
import { DesktopStatusProvider } from "@/components/desktop/useDesktopStatus";
import { DesktopWindowProvider } from "@/components/desktop/useDesktopWindow";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://app.mutx.dev",
  },
  metadataBase: new URL("https://app.mutx.dev"),
  robots: {
    index: true,
    follow: true,
    nocache: false,
  },
  title: "Dashboard - MUTX",
  description: "Operator dashboard for agents, deployments, runs, budgets, webhooks, and governance.",
  keywords: [
    "agent control plane",
    "agent deployments",
    "agent environments",
    "agent governance",
    "webhooks",
    "api keys",
    "runs",
    "audit trail",
  ],
  openGraph: {
    title: "Dashboard - MUTX",
    description: "Operator dashboard for agents, deployments, runs, budgets, webhooks, and governance.",
    url: "https://app.mutx.dev",
    images: ["https://app.mutx.dev/opengraph-image?title=Dashboard%20-%20MUTX&description=Operator%20dashboard%20for%20agents%2C%20deployments%2C%20runs%2C%20budgets%2C%20webhooks%2C%20and%20governance."],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dashboard - MUTX",
    description: "Operator dashboard for agents, deployments, runs, budgets, webhooks, and governance.",
    images: ["https://app.mutx.dev/twitter-image?title=Dashboard%20-%20MUTX&description=Operator%20dashboard%20for%20agents%2C%20deployments%2C%20runs%2C%20budgets%2C%20webhooks%2C%20and%20governance."],
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${appFontVariables} h-full font-[family:var(--font-site-body)]`}>
      <ErrorBoundary>
        <DesktopStatusProvider>
          <DesktopWindowProvider>
            <DesktopJobProvider>
              <DesktopRouteListener />
              <DashboardShell>{children}</DashboardShell>
            </DesktopJobProvider>
          </DesktopWindowProvider>
        </DesktopStatusProvider>
      </ErrorBoundary>
    </div>
  );
}
