import type { Metadata } from "next";

import { MarketingHomePage } from "@/components/site/marketing/MarketingHomePage";
import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicSurface } from "@/components/site/PublicSurface";

export const metadata: Metadata = {
  title: "MUTX | The Open Control Plane for AI Agents",
  description:
    "Deploy, govern, and share AI agents with an open control plane for production runtimes, traces, auth boundaries, and operator workflows.",
};

export default function HomePage() {
  return (
    <PublicSurface>
      <MarketingHomePage />
      <PublicFooter showCallout={false} />
    </PublicSurface>
  );
}
