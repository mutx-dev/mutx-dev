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
  title: 'MUTX | Assistant Control Plane',
  description: 'Deploy Personal Assistant first. Operate sessions, skills, channels, deployments, and health from one assistant-first control plane.',
  keywords: ['assistant control plane', 'personal assistant', 'OpenClaw', 'agent runtime', 'sessions', 'skills', 'channels', 'deployments'],
  openGraph: {
    locale: 'en_US',
    title: 'MUTX | Assistant Control Plane',
    description: 'Deploy Personal Assistant first and operate the runtime across web, CLI, and TUI.',
    url: 'https://mutx.dev',
    siteName: 'MUTX',
    images: [{ url: 'https://mutx.dev/landing/victory-core.png', width: 1536, height: 1024, alt: 'MUTX robot holding the MUTX mark aloft' }],
    type: 'website',
  },
  twitter: {
    creator: '@mutxdev',
    card: 'summary_large_image',
    site: '@mutxdev',
    title: 'MUTX | Assistant Control Plane',
    description: 'Deploy Personal Assistant first. Operate sessions, skills, channels, deployments, and health from one control plane.',
    images: ['https://mutx.dev/landing/victory-core.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
        <meta name="theme-color" content="#050816" />
      </head>
      <body className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} h-full min-h-screen font-[family:var(--font-display)] antialiased`}>
        <AuthNav />
        {children}
      </body>
    </html>
  )
}
