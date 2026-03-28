import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  alternates: {
    canonical: "https://mutx.dev",
  },
  metadataBase: new URL("https://mutx.dev"),
  title: "MUTX | Control Plane For Deployed Agents",
  description:
    "Operate deployed agents with real auth, deployments, traces, webhooks, runtime posture, and operator tooling across web, API, CLI, and docs.",
  keywords: [
    "agent control plane",
    "agent deployments",
    "operator dashboard",
    "webhooks",
    "traces",
    "runtime operations",
    "OpenClaw",
    "deployment control plane",
  ],
  openGraph: {
    locale: "en_US",
    title: "MUTX | Control Plane For Deployed Agents",
    description:
      "MUTX is the control plane for agents that have to survive real deployments, auth boundaries, webhooks, and runtime operations.",
    url: "https://mutx.dev",
    siteName: "MUTX",
    images: [
      {
        url: "https://mutx.dev/landing/webp/victory-core.webp",
        width: 1536,
        height: 1024,
        alt: "MUTX robot holding the MUTX mark aloft",
      },
    ],
    type: "website",
  },
  twitter: {
    creator: "@mutxdev",
    card: "summary_large_image",
    site: "@mutxdev",
    title: "MUTX | Control Plane For Deployed Agents",
    description:
      "Operate deployed agents across auth, deployments, traces, webhooks, and runtime posture.",
    images: ["https://mutx.dev/landing/webp/victory-core.webp"],
  },
  icons: {
    icon: "/favicon.ico",
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
        <meta name="theme-color" content="#060810" />
      </head>
      <body className="h-full min-h-screen antialiased">{children}</body>
    </html>
  );
}
