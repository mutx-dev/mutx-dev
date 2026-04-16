import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'

import { routing } from '@/i18n/routing'
import { resolvePicoLocale } from '@/lib/pico/locale'
import {
  DEFAULT_X_HANDLE,
  getPageOgImageUrl,
  getPageTwitterImageUrl,
} from '@/lib/seo'

const PICO_HOST = 'https://pico.mutx.dev'

export async function buildPicoPageMetadata(
  namespace: string,
  pathname: string,
  values?: Record<string, string | number>,
): Promise<Metadata> {
  const locale = resolvePicoLocale(await getLocale())
  const t = await getTranslations({ locale, namespace })
  const title = t('title', values)
  const description = t('description', values)
  const url = pathname === '/' ? PICO_HOST : `${PICO_HOST}${pathname}`

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(
        routing.locales.map((supportedLocale) => [supportedLocale, url]),
      ),
    },
    openGraph: {
      title,
      description,
      url,
      locale,
      images: [getPageOgImageUrl(title, description, { path: pathname, host: PICO_HOST })],
    },
    twitter: {
      card: 'summary_large_image',
      creator: DEFAULT_X_HANDLE,
      title,
      description,
      images: [getPageTwitterImageUrl(title, description, { path: pathname, host: PICO_HOST })],
    },
  }
}
