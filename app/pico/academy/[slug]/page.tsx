import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PicoLessonDetail } from '@/components/pico/PicoLessonDetail'
import { PICO_LESSONS, getLessonBySlug } from '@/lib/pico/academy'

type PicoLessonPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return PICO_LESSONS.map((lesson) => ({ slug: lesson.slug }))
}

export async function generateMetadata({ params }: PicoLessonPageProps): Promise<Metadata> {
  const { slug } = await params
  const lesson = getLessonBySlug(slug)

  if (!lesson) {
    return {}
  }

  return {
    title: `${lesson.title} — PicoMUTX Academy`,
    description: lesson.summary ?? `Learn ${lesson.title} on PicoMUTX Academy.`,
  }
}

export default async function PicoLessonPage({ params }: PicoLessonPageProps) {
  const { slug } = await params
  const lesson = getLessonBySlug(slug)

  if (!lesson) {
    notFound()
  }

  return <PicoLessonDetail lesson={lesson} />
}
