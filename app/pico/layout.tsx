import type { ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'

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
