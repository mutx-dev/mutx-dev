import type { Metadata } from "next";

import MacDownloadPage from "./macos/page";
import { DEFAULT_X_HANDLE, getCanonicalUrl, getPageOgImageUrl, getPageTwitterImageUrl } from "@/lib/seo";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Download MUTX | MUTX",
  description:
    "Download the latest MUTX desktop release for your platform. Signed builds, checksums, and release notes.",
  alternates: {
    canonical: getCanonicalUrl("/download"),
  },
  openGraph: {
    title: "Download MUTX | MUTX",
    description:
      "Download the latest MUTX desktop release for your platform. Signed builds, checksums, and release notes.",
    url: getCanonicalUrl("/download"),
    images: [getPageOgImageUrl("Download MUTX | MUTX", "Download the latest MUTX desktop release for your platform. Signed builds, checksums, and release notes.", { path: "/download" })],
  },
  twitter: {
    card: "summary_large_image",
    creator: DEFAULT_X_HANDLE,
    title: "Download MUTX | MUTX",
    description:
      "Download the latest MUTX desktop release for your platform. Signed builds, checksums, and release notes.",
    images: [getPageTwitterImageUrl("Download MUTX | MUTX", "Download the latest MUTX desktop release for your platform. Signed builds, checksums, and release notes.", { path: "/download" })],
  },
};

export default MacDownloadPage;
