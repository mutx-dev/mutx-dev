import { redirect } from 'next/navigation'

export default async function PicoLegacyLessonPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`/pico/academy/${slug}`)
}
