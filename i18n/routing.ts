import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ar'],
  defaultLocale: 'en',
  pathnames: {
    '/': '/',
  },
})

export type Locale = (typeof routing.locales)[number]
