import { generateMetadata as supportGenerateMetadata } from '../../app/support/page'

jest.mock('fs', () => ({
  readFileSync: jest.fn(() => `---\ndescription: Where to report bugs, request features, improve docs, or escalate security issues.\ntitle: Support\n---\n\n# Support\n`),
}))

jest.mock('path', () => ({
  join: jest.fn((...parts: string[]) => parts.join('/')),
}))

jest.mock('gray-matter', () =>
  jest.fn(() => ({
    data: {
      title: 'Support',
      description: 'Where to report bugs, request features, improve docs, or escalate security issues.',
    },
    content: '# Support',
  }))
)

jest.mock('@/components/site/docs/DocsLayout', () => ({
  DocsLayout: ({ children }: { children: unknown }) => children,
}))

jest.mock('remark', () => ({
  remark: () => ({
    use() {
      return this
    },
    async process(content: string) {
      return content
    },
  }),
}))

jest.mock('remark-gfm', () => ({}))

describe('support page metadata', () => {
  it('reads frontmatter into canonical + social metadata', async () => {
    const metadata = await supportGenerateMetadata()

    expect(metadata.title).toBe('Support — MUTX')
    expect(metadata.description).toBe(
      'Where to report bugs, request features, improve docs, or escalate security issues.'
    )
    expect(metadata.alternates?.canonical).toBe('https://mutx.dev/support')
    expect(metadata.openGraph).toMatchObject({
      title: 'Support — MUTX',
      description:
        'Where to report bugs, request features, improve docs, or escalate security issues.',
      url: 'https://mutx.dev/support',
    })
    expect(metadata.twitter).toMatchObject({
      title: 'Support — MUTX',
      description:
        'Where to report bugs, request features, improve docs, or escalate security issues.',
      card: 'summary_large_image',
    })
  })
})
