import type { Metadata } from "next";

import MacDownloadPage from "./macos/page";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = 900;

export const metadata: Metadata = {
  title: "Download MUTX | MUTX",
  description:
    "Download the latest MUTX desktop release for your platform. Signed builds, checksums, and release notes.",
  ...buildPageMetadata({
    title: "Download MUTX | MUTX",
    description:
      "Download the latest MUTX desktop release for your platform. Signed builds, checksums, and release notes.",
    path: "/download",
  }),
};

export default MacDownloadPage;
