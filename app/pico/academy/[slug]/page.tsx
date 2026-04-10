import { notFound } from 'next/navigation'

import { PicoLessonDetail } from '@/components/pico/PicoLessonDetail'
import { PICO_LESSONS, getLessonBySlug } from '@/lib/pico/academy'

export function generateStaticParams() {
  return PICO_LESSONS.map((lesson) => ({ slug: lesson.slug }))
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
