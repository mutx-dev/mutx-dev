import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

import { ErrorBoundary } from "@/components/app/ErrorBoundary";
import { DemoViewportLock } from "@/components/dashboard/demo/DemoViewportLock";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-control-display",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-control-mono",
});

export const metadata: Metadata = {
  alternates: {
    canonical: "https://app.mutx.dev/control",
  },
  metadataBase: new URL("https://app.mutx.dev"),
  robots: {
    index: false,
    follow: false,
    nocache: true,
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
        <div
          className={`${ibmPlexSans.className} ${bricolageGrotesque.variable} ${ibmPlexMono.variable} h-full overflow-hidden`}
        >
          {children}
        </div>
      </DemoViewportLock>
    </ErrorBoundary>
  );
}
