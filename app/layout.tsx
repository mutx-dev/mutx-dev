import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://mutx.dev'),
  title: 'mutx.dev | Mission Control',
  description: 'Production infrastructure for AI agents that actually work.',
  keywords: ['AI agents', 'agent infrastructure', 'waitlist', 'deployment'],
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#030307" />
      </head>
      <body className={`${spaceGrotesk.className} min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  )
}
