import { notFound } from 'next/navigation'

import { PicoLessonDetail } from '@/components/pico/PicoLessonDetail'
import { getLessonBySlug } from '@/lib/pico/academy'

type PicoLessonPageProps = {
  params: Promise<{ slug: string }>
}

export default async function PicoLessonPage({ params }: PicoLessonPageProps) {
  const { slug } = await params
  const lesson = getLessonBySlug(slug)

  if (!lesson) {
    notFound()
  }

  return <PicoLessonDetail lesson={lesson} />
}
