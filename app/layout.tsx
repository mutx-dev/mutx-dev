import type { Metadata } from "next";
import "./globals.css";

import { appFontVariables } from "@/app/fonts/app";
import {
  DEFAULT_OG_IMAGE_ALT,
  DEFAULT_X_HANDLE,
  getCanonicalUrl,
  getOgImageUrl,
  getSiteUrl,
  getTwitterImageUrl,
} from "@/lib/seo";

const siteUrl = getSiteUrl();
const ogImageUrl = getOgImageUrl();
const twitterImageUrl = getTwitterImageUrl();

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#09080b',
} as const

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: getCanonicalUrl(),
  },
  title: "MUTX | Open Control Plane for AI Agents",
  description:
    "Operate deployed agents with real auth, deployments, traces, webhooks, runtime posture, and operator tooling across web, API, CLI, and docs.",
  applicationName: "MUTX",
  category: "developer tools",
  keywords: [
    "agent control plane",
    "agent deployments",
    "operator dashboard",
    "webhooks",
    "traces",
    "runtime operations",
    "AI agent infrastructure",
    "deployment control plane",
  ],
  authors: [{ name: "MUTX" }],
  creator: "MUTX",
  publisher: "MUTX",
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    locale: "en_US",
    title: "MUTX | Open Control Plane for AI Agents",
    description:
      "MUTX is the open control plane for agents that have to survive real deployments, auth boundaries, webhooks, and runtime operations.",
    url: siteUrl,
    siteName: "MUTX",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: DEFAULT_OG_IMAGE_ALT,
      },
    ],
    type: "website",
  },
  twitter: {
    creator: DEFAULT_X_HANDLE,
    card: "summary_large_image",
    site: DEFAULT_X_HANDLE,
    title: "MUTX | Open Control Plane for AI Agents",
    description:
      "Operate deployed agents across auth, deployments, traces, webhooks, and runtime posture.",
    images: [twitterImageUrl],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(window.sessionStorage.getItem('mutx-home-loader-played')==='1'){document.documentElement.setAttribute('data-home-loader-played','1');}}catch(_error){}})();",
          }}
        />
        <link rel="preconnect" href="https://calendly.com" />
        <link rel="dns-prefetch" href="https://calendly.com" />
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
        <link
          rel="preload"
          href="/landing/webp/victory-core.webp"
          as="image"
          type="image/webp"
        />
        <meta name="theme-color" content="#09080b" />
      </head>
      <body className={`${appFontVariables} h-full min-h-screen antialiased`}>{children}</body>
    </html>
  );
}
