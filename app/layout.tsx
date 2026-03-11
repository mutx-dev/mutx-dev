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
  metadataBase: new URL('https://mutx.dev'),
  title: 'MUTX | Open Source Control Plane for AI Agents',
  description: 'Deploy, operate, and observe AI agents with a FastAPI control plane, Next.js operator surface, Python CLI, SDK, and infrastructure automation.',
  keywords: ['AI agents', 'agent infrastructure', 'fastapi', 'next.js', 'python sdk', 'terraform', 'railway', 'waitlist'],
  openGraph: {
    title: 'MUTX | Open Source Control Plane for AI Agents',
    description: 'A production-minded stack for auth, agents, deployments, webhooks, API keys, and infrastructure automation.',
    url: 'https://mutx.dev',
    siteName: 'MUTX',
    images: [{ url: 'https://mutx.dev/logo.png', width: 300, height: 300, alt: 'MUTX | Open Source Control Plane for AI Agents' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@mutx_dev',
    title: 'MUTX | Open Source Control Plane for AI Agents',
    description: 'Deploy, operate, and observe AI agents with a real stack: web, API, CLI, SDK, infra, and a live waitlist.',
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
