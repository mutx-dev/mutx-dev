import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";

import { ErrorBoundary } from "@/components/app/ErrorBoundary";
import { DemoViewportLock } from "@/components/dashboard/demo/DemoViewportLock";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  alternates: {
    canonical: "https://app.mutx.dev/control",
  },
  metadataBase: new URL("https://app.mutx.dev"),
  title: "MUTX Control Plane",
  description: "Operator-grade control plane for deploying, observing, and governing agent infrastructure.",
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
    title: "MUTX Control Plane",
    description: "Operator-grade control plane for deploying, observing, and governing agent infrastructure.",
    url: "https://app.mutx.dev/control",
  },
  twitter: {
    title: "MUTX Control Plane",
    description: "Operator-grade control plane for deploying, observing, and governing agent infrastructure.",
    images: ["https://mutx.dev/landing/victory-core.png"],
  },
};

export default function AppDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <DemoViewportLock>
        <div className={`${ibmPlexSans.className} h-full overflow-hidden`}>{children}</div>
      </DemoViewportLock>
    </ErrorBoundary>
  );
}
