import type { Metadata } from "next";

import { PicoLandingPage } from "@/components/site/pico/PicoLandingPage";
import { PublicFooter } from "@/components/site/PublicFooter";
import { PublicSurface } from "@/components/site/PublicSurface";
import { getCanonicalUrl, getOgImageUrl, getSiteUrl } from "@/lib/seo";

const pageTitle = "PicoMUTX | Stop Babysitting Your AI Agents";
const pageDescription =
  "PicoMUTX gives you live visibility, cost control, and smart approval gates for every AI agent — live in 30 minutes, no rearchitecting required.";

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: {
    canonical: `${getCanonicalUrl()}/pico`,
  },
  openGraph: {
    title: pageTitle,
    description: pageDescription,
    url: `${getSiteUrl()}/pico`,
    images: [getOgImageUrl()],
  },
};

export default function PicoPage() {
  return (
    <PublicSurface>
      <PicoLandingPage />
      <PublicFooter showCallout={false} />
    </PublicSurface>
  );
}
