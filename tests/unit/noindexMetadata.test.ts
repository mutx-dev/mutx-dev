import type { ReactNode } from 'react'

jest.mock('../../app/fonts/app', () => ({ appFontVariables: 'font-vars' }))
jest.mock('next-intl', () => ({
  NextIntlClientProvider: ({ children }: { children: ReactNode }) => children,
}))
jest.mock('next-intl/server', () => ({
  getLocale: jest.fn(async () => 'en'),
  getMessages: jest.fn(async () => ({})),
}))

import { metadata as dashboardMetadata } from '../../app/dashboard/layout'
import { metadata as forgotPasswordMetadata } from '../../app/forgot-password/layout'
import { metadata as loginMetadata } from '../../app/login/layout'
import { metadata as registerMetadata } from '../../app/register/layout'
import { metadata as resetPasswordMetadata } from '../../app/reset-password/layout'
import { metadata as verifyEmailMetadata } from '../../app/verify-email/layout'

const noindexLayouts = [
  ['dashboard', dashboardMetadata],
  ['forgot-password', forgotPasswordMetadata],
  ['login', loginMetadata],
  ['register', registerMetadata],
  ['reset-password', resetPasswordMetadata],
  ['verify-email', verifyEmailMetadata],
] as const

describe('noindex metadata boundaries', () => {
  it.each(noindexLayouts)('%s stays out of the index', (_label, metadata) => {
    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false,
      nocache: true,
    })
  })
})
