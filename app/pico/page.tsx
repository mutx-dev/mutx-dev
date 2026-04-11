import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'

import { PicoLandingSurface } from '@/components/pico/PicoLandingSurface'
import { routing } from '@/i18n/routing'
import { DEFAULT_X_HANDLE, getPageOgImageUrl, getPageTwitterImageUrl } from '@/lib/seo'

function normalizeLocale(locale: string) {
  return routing.locales.includes(locale as (typeof routing.locales)[number])
    ? locale
    : routing.defaultLocale
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = normalizeLocale(await getLocale())
  const t = await getTranslations({ locale, namespace: 'pico.meta' })
  const pageTitle = t('title')
  const pageDescription = t('description')

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: 'https://pico.mutx.dev',
      languages: Object.fromEntries(routing.locales.map((supportedLocale) => [supportedLocale, 'https://pico.mutx.dev'])),
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: 'https://pico.mutx.dev',
      locale,
      images: [getPageOgImageUrl(pageTitle, pageDescription, { path: '/pico', host: 'https://pico.mutx.dev' })],
    },
    twitter: {
      card: 'summary_large_image',
      creator: DEFAULT_X_HANDLE,
      title: pageTitle,
      description: pageDescription,
      images: [getPageTwitterImageUrl(pageTitle, pageDescription, { path: '/pico', host: 'https://pico.mutx.dev' })],
    },
  }
}

export default async function PicoPage() {
  const locale = normalizeLocale(await getLocale())
  const t = await getTranslations({ locale, namespace: 'pico.meta' })
  const pageTitle = t('title')
  const pageDescription = t('description')

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            inLanguage: locale,
            name: pageTitle,
            url: 'https://pico.mutx.dev',
            description: pageDescription,
            isPartOf: {
              '@type': 'WebSite',
              name: 'PicoMUTX',
              url: 'https://pico.mutx.dev',
            },
          }),
        }}
      />
      <PicoLandingSurface />
    </>
  );
}
