import type { Metadata } from "next";

import MacDownloadPage from "./macos/page";
import { DEFAULT_X_HANDLE, getCanonicalUrl, getOgImageUrl } from "@/lib/seo";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Download for macOS | MUTX",
  description:
    "Download the latest signed and notarized MUTX macOS release for Apple Silicon or Intel, with checksums and release notes.",
  alternates: {
    canonical: getCanonicalUrl("/download"),
  },
  openGraph: {
    title: "Download for macOS | MUTX",
    description:
      "Download the latest signed and notarized MUTX macOS release for Apple Silicon or Intel, with checksums and release notes.",
    url: getCanonicalUrl("/download"),
    images: [getPageOgImageUrl("Download for macOS | MUTX", "Download the latest signed and notarized MUTX macOS release for Apple Silicon or Intel, with checksums and release notes.", { path: "/download" })],
  },
  twitter: {
    card: "summary_large_image",
    creator: DEFAULT_X_HANDLE,
    title: "Download for macOS | MUTX",
    description:
      "Download the latest signed and notarized MUTX macOS release for Apple Silicon or Intel, with checksums and release notes.",
    images: [getPageOgImageUrl("Download for macOS | MUTX", "Download the latest signed and notarized MUTX macOS release for Apple Silicon or Intel, with checksums and release notes.", { path: "/download" })],
  },
};

export default MacDownloadPage;
