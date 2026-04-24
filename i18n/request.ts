import { cookies, headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'

import { PICO_AUTH_LOCALE_COOKIE, PICO_LOCALES } from '@/lib/pico/locale'
import { loadPicoMessages } from '@/lib/pico/messages'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  if (!locale) {
    const headerStore = await headers()
    const headerLocale = headerStore.get('x-mutx-locale')

    if (headerLocale && PICO_LOCALES.includes(headerLocale as (typeof PICO_LOCALES)[number])) {
      locale = headerLocale
    }
  }

  if (!locale) {
    const cookieStore = await cookies()
    const cookieLocale =
      cookieStore.get(PICO_AUTH_LOCALE_COOKIE)?.value ?? cookieStore.get('NEXT_LOCALE')?.value

    if (cookieLocale && PICO_LOCALES.includes(cookieLocale as (typeof PICO_LOCALES)[number])) {
      locale = cookieLocale
    }
  }

  const resolved = await loadPicoMessages(locale)

  return {
    locale: resolved.locale,
    messages: resolved.messages,
  }
})
