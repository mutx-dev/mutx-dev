import type { Metadata } from 'next'
import { IBM_Plex_Mono, Space_Grotesk } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' })
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://mutx.dev',
  },
  metadataBase: new URL('https://mutx.dev'),
  title: 'MUTX | Open Source Control Plane for AI Agents',
  description: 'Open-source control plane foundations for AI agents: auth, agent and deployment records, API keys, webhook ingestion, health checks, and coordinated web, API, CLI, and SDK surfaces.',
  keywords: ['AI agents', 'agent infrastructure', 'fastapi', 'next.js', 'python sdk', 'terraform', 'railway', 'waitlist'],
  openGraph: {
    locale: 'en_US',
    title: 'MUTX | Open Source Control Plane for AI Agents',
    description: 'An open-source control plane for AI agents with real auth, durable resources, API keys, health surfaces, and infrastructure foundations.',
    url: 'https://mutx.dev',
    siteName: 'MUTX',
    images: [{ url: 'https://mutx.dev/logo.png', width: 300, height: 300, alt: 'MUTX | Open Source Control Plane for AI Agents' }],
    type: 'website',
  },
  twitter: {
    creator: '@mutxdev',
    card: 'summary_large_image',
    site: '@mutxdev',
    title: 'MUTX | Open Source Control Plane for AI Agents',
    description: 'Open-source control plane foundations for teams operating AI agents beyond the demo.',
    images: ['https://mutx.dev/logo.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
        <meta name="theme-color" content="#050816" />
      </head>
      <body className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} min-h-screen font-[family:var(--font-display)] antialiased`}>
        {children}
      </body>
    </html>
  )
}
