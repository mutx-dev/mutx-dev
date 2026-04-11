import type { Metadata } from 'next'

import { PicoLessonPage } from '@/components/site/pico/PicoLessonPage'
import { PublicSurface } from '@/components/site/PublicSurface'
import { picoLessonBySlug } from '@/lib/pico/catalog'
import { getCanonicalUrl } from '@/lib/seo'

type LessonPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { slug } = await params
  const lesson = picoLessonBySlug[slug]

  return {
    title: lesson ? `${lesson.title} - PicoMUTX` : 'Pico lesson',
    description: lesson?.summary || 'PicoMUTX lesson',
    alternates: {
      canonical: getCanonicalUrl(`/pico/app/lessons/${slug}`),
    },
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { slug } = await params

  return (
    <PublicSurface>
      <PicoLessonPage slug={slug} />
    </PublicSurface>
  )
}
