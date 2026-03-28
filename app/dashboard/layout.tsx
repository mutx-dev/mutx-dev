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
  },
  twitter: {
    title: "Dashboard - MUTX",
    description: "Operator dashboard for agents, deployments, runs, budgets, webhooks, and governance.",
    images: ["https://mutx.dev/landing/victory-core.png"],
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${appFontVariables} h-full font-[family:var(--font-display)]`}>
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
