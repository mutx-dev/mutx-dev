describe('pico tutor route', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  it('returns a grounded tutor reply for a valid question', async () => {
    const { POST } = await import('../../app/api/pico/tutor/route')

    const response = await POST(
      new Request('http://localhost/api/pico/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: 'How do I schedule a cron workflow for my agent?',
          lessonSlug: 'create-a-scheduled-workflow',
        }),
      }) as never,
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      title: 'Create a scheduled workflow',
      recommendedLessonIds: expect.arrayContaining(['create-a-scheduled-workflow']),
      lessons: expect.arrayContaining([
        expect.objectContaining({ href: '/pico/academy/create-a-scheduled-workflow' }),
      ]),
      nextActions: expect.any(Array),
    })
  })

  it('rejects empty questions', async () => {
    const { POST } = await import('../../app/api/pico/tutor/route')

    const response = await POST(
      new Request('http://localhost/api/pico/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: '   ' }),
      }) as never,
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      status: 'error',
      error: {
        code: 'BAD_REQUEST',
        message: 'Question is required',
      },
    })
  })
})
