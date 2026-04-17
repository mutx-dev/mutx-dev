import type { Metadata } from "next";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import { appFontVariables } from "@/app/fonts/app";
import { AppDomainDemoIntro } from "@/components/app/AppDomainDemoIntro";
import { GlobalLangSwitcher } from "@/components/i18n/GlobalLangSwitcher";
import {
  buildPageMetadata,
  getSiteUrl,
} from "@/lib/seo";

const siteUrl = getSiteUrl();
const rootSocialMetadata = buildPageMetadata({
  title: "MUTX | Open Control Plane for AI Agents",
  description:
    "Operate deployed agents with real auth, deployments, traces, webhooks, runtime posture, and operator tooling across web, API, CLI, and docs.",
  path: "/",
  socialDescription:
    "MUTX is the open control plane for agents that have to survive real deployments, auth boundaries, webhooks, and runtime operations.",
  twitterDescription:
    "Operate deployed agents across auth, deployments, traces, webhooks, and runtime posture.",
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#09080b',
} as const

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  ...rootSocialMetadata,
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
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} className="h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(window.sessionStorage.getItem('mutx-home-loader-played')==='1'){document.documentElement.setAttribute('data-home-loader-played','1');document.documentElement.setAttribute('data-loader-state','complete');}}catch(_error){}})();",
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var host=window.location.hostname.toLowerCase();if(host==='app.mutx.dev'||host==='app.localhost'){if(window.sessionStorage.getItem('mutx-app-demo-intro-played')==='1'){document.documentElement.setAttribute('data-app-demo-intro-played','1');}else{document.documentElement.setAttribute('data-app-demo-intro-active','1');}}}catch(_error){}})();",
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
      <body className={`${appFontVariables} h-full min-h-screen antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <GlobalLangSwitcher />
          {children}
          <AppDomainDemoIntro />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
