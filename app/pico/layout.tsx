import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'

export const metadata: Metadata = {
  manifest: '/pico/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/pico/favicon.ico' },
      { url: '/pico/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/pico/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/pico/apple-touch-icon.png',
    shortcut: '/pico/favicon.ico',
  },
}

type Props = {
  children: ReactNode
}

export default async function PicoLayout({ children }: Props) {
  // getLocale() reads NEXT_LOCALE cookie — matches what proxy.ts sets
  const locale = routing.locales.includes(await getLocale() as (typeof routing.locales)[number])
    ? await getLocale()
    : 'en'

  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
