import type { Metadata } from 'next'
import { IBM_Plex_Mono, Space_Grotesk } from 'next/font/google'
import { AuthNav } from '@/components/AuthNav'
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
  title: 'MUTX | The Control Plane for AI Agents',
  description: 'Deploy agents like software. Govern them like systems. MUTX is the open-source control plane for deployments, runs, traces, webhooks, keys, docs, and operator recovery.',
  keywords: ['AI agents', 'agent infrastructure', 'control plane', 'deployments', 'traces', 'webhooks', 'fastapi', 'next.js', 'python sdk'],
  openGraph: {
    locale: 'en_US',
    title: 'MUTX | The Control Plane for AI Agents',
    description: 'Deploy agents like software. Govern them like systems. Open-source infrastructure with a pulse.',
    url: 'https://mutx.dev',
    siteName: 'MUTX',
    images: [{ url: 'https://mutx.dev/landing/hero-manifesto.png', width: 1536, height: 1024, alt: 'MUTX control plane landing page hero art' }],
    type: 'website',
  },
  twitter: {
    creator: '@mutxdev',
    card: 'summary_large_image',
    site: '@mutxdev',
    title: 'MUTX | The Control Plane for AI Agents',
    description: 'Open-source control plane for teams deploying, governing, and recovering AI agents in the wild.',
    images: ['https://mutx.dev/landing/hero-manifesto.png'],
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
        <AuthNav />
        {children}
      </body>
    </html>
  )
}
