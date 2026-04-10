import type { Metadata } from "next";

import { PicoLandingPage } from "@/components/site/pico/PicoLandingPage";
import { PicoFooter } from "@/components/site/pico/PicoFooter";
import { PublicSurface } from "@/components/site/PublicSurface";
import { getCanonicalUrl, getPageOgImageUrl, getSiteUrl } from "@/lib/seo";

const pageTitle = "PicoMUTX — Build and Deploy AI Agents Safely Without Hiring a Developer";
const pageDescription =
  "PicoMUTX helps founders, operators, and small teams build, deploy, and run AI agents safely — with step-by-step guidance, built-in safeguards, and real support. Pre-register now for early access.";

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
    images: [getPageOgImageUrl(pageTitle, pageDescription, { path: "/pico" })],
  },
};

export default function PicoPage() {
  return (
    <PublicSurface>
      <PicoLandingPage />
      <PicoFooter />
    </PublicSurface>
  );
}
