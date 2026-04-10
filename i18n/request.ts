import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'
import { cookies } from 'next/headers'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  // Fall back to NEXT_LOCALE cookie when requestLocale is empty
  // This handles cookie-driven locale switching on paths without locale segments (e.g. /)
  if (!locale) {
    const cookieStore = await cookies()
    const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
    if (cookieLocale && routing.locales.includes(cookieLocale as (typeof routing.locales)[number])) {
      locale = cookieLocale
    }
  }

  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
