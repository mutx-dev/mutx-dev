import { NextRequest, NextResponse } from 'next/server'

import { badRequest, withErrorHandling } from '@/app/api/_lib/errors'
import { answerPicoTutorQuestion, answerTutorQuestion } from '@/lib/pico/tutor'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  return withErrorHandling(async () => {
    const body = await request.json().catch(() => null)
    const question = typeof body?.question === 'string' ? body.question.trim() : ''
    const lessonSlug = typeof body?.lessonSlug === 'string' ? body.lessonSlug : null

    if (!question) {
      return badRequest('Question is required')
    }

    const answer = answerPicoTutorQuestion(question, {
      lessonSlug,
      progress: body?.progress,
    })
    const reply = answerTutorQuestion(question, body?.progress)

    return NextResponse.json({
      ...answer,
      reply,
    })
  })(request)
}
