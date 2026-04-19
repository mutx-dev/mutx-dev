import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PicoLessonDetail } from '@/components/pico/PicoLessonDetail'
import { PICO_LESSONS, getLessonBySlug } from '@/lib/pico/academy'
import { buildPicoPageMetadata } from '@/lib/pico/metadata'
import { loadPicoMessages } from '@/lib/pico/messages'
import { getLocale } from 'next-intl/server'

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

  const locale = await getLocale()
  const { messages } = await loadPicoMessages(locale)
  const localizedLesson =
    (messages as {
      pico?: {
        content?: {
          lessons?: Record<string, { title?: string; summary?: string }>
        }
      }
    }).pico?.content?.lessons?.[slug]

  return buildPicoPageMetadata('pico.pages.lesson.meta', `/academy/${lesson.slug}`, {
    title: localizedLesson?.title ?? lesson.title,
    summary: localizedLesson?.summary ?? lesson.summary,
  })
}

export default async function PicoLessonPage({ params }: PicoLessonPageProps) {
  const { slug } = await params
  const lesson = getLessonBySlug(slug)

  if (!lesson) {
    notFound()
  }

  return <PicoLessonDetail lesson={lesson} />
}
