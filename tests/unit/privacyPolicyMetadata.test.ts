import { metadata as privacyPolicyMetadata } from '../../app/privacy-policy/page'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children }: { children: unknown }) => children,
}))

jest.mock('@/components/site/PublicNav', () => ({
  PublicNav: () => null,
}))

jest.mock('@/components/site/PublicFooter', () => ({
  PublicFooter: () => null,
}))

jest.mock('@/components/site/PublicSurface', () => ({
  PublicSurface: ({ children }: { children: unknown }) => children,
}))

jest.mock('@/components/site/marketing/MarketingCore.module.css', () => ({}))

describe('privacy policy metadata', () => {
  it('keeps canonical + social cards aligned', () => {
    expect(privacyPolicyMetadata.title).toBe('Privacy Policy | MUTX')
    expect(privacyPolicyMetadata.description).toContain('site, downloads, docs, and support surfaces')
    expect(privacyPolicyMetadata.alternates?.canonical).toBe('https://mutx.dev/privacy-policy')
    expect(privacyPolicyMetadata.openGraph).toMatchObject({
      title: 'Privacy Policy | MUTX',
      url: 'https://mutx.dev/privacy-policy',
    })
    expect(privacyPolicyMetadata.twitter).toMatchObject({
      title: 'Privacy Policy | MUTX',
      card: 'summary_large_image',
    })
  })
})
