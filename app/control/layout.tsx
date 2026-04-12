import type { Metadata } from "next";

import { appFontVariables } from "@/app/fonts/app";
import { ErrorBoundary } from "@/components/app/ErrorBoundary";
import { DemoViewportLock } from "@/components/dashboard/demo/DemoViewportLock";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://app.mutx.dev/control",
  },
  metadataBase: new URL("https://app.mutx.dev"),
  robots: {
    index: true,
    follow: true,
    nocache: false,
  },
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
    images: ["https://app.mutx.dev/opengraph-image?title=MUTX%20Control%20Plane&description=Operator-grade%20control%20plane%20for%20deploying%2C%20observing%2C%20and%20governing%20agent%20infrastructure."],
  },
  twitter: {
    card: "summary_large_image",
    title: "MUTX Control Plane",
    description: "Operator-grade control plane for deploying, observing, and governing agent infrastructure.",
    images: ["https://app.mutx.dev/twitter-image?title=MUTX%20Control%20Plane&description=Operator-grade%20control%20plane%20for%20deploying%2C%20observing%2C%20and%20governing%20agent%20infrastructure."],
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
        <div className={`${appFontVariables} h-full overflow-hidden font-[family:var(--font-site-body)]`}>
          {children}
        </div>
      </DemoViewportLock>
    </ErrorBoundary>
  );
}
