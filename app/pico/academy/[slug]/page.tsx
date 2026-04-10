import { notFound } from "next/navigation";

import { PicoLessonPage } from "@/components/pico/PicoLessonPage";
import { getPicoLesson } from "@/lib/pico/course";

export default async function PicoLessonRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = getPicoLesson(slug);

  if (!lesson) {
    notFound();
  }

  return <PicoLessonPage lesson={lesson} />;
}