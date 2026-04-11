import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PicoLessonDetail } from '@/components/pico/PicoLessonDetail'
import { PICO_LESSONS, getLessonBySlug } from '@/lib/pico/academy'

export function generateStaticParams() {
  return PICO_LESSONS.map((lesson) => ({ slug: lesson.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const lesson = getLessonBySlug(slug)

  if (!lesson) {
    return {
      title: 'PicoMUTX Lesson',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  return {
    title: `${lesson.title} | PicoMUTX Academy`,
    description: lesson.summary,
    alternates: {
      canonical: `https://pico.mutx.dev/academy/${lesson.slug}`,
    },
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default async function PicoLessonPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const lesson = getLessonBySlug(slug)

  if (!lesson) {
    notFound()
  }

  return <PicoLessonDetail lesson={lesson} />
}
