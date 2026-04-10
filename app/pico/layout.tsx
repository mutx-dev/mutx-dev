import type { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'

type Props = {
  children: ReactNode
  params: Promise<{ locale?: string }>
}

export default async function PicoLayout({ children, params }: Props) {
  const { locale } = await params

  // Validate locale
  const validLocale = locale && routing.locales.includes(locale as (typeof routing.locales)[number])
    ? locale
    : 'en'

  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={validLocale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}
