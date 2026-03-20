import type { Metadata } from "next";

import { ErrorBoundary } from "@/components/app/ErrorBoundary";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://app.mutx.dev",
  },
  metadataBase: new URL("https://app.mutx.dev"),
  title: "Dashboard - MUTX",
  description: "Demo overview for the MUTX control plane.",
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
    description: "Demo overview for the MUTX control plane.",
    url: "https://app.mutx.dev",
  },
  twitter: {
    title: "Dashboard - MUTX",
    description: "Demo overview for the MUTX control plane.",
    images: ["https://mutx.dev/landing/victory-core.png"],
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <DashboardShell>{children}</DashboardShell>
    </ErrorBoundary>
  );
}
