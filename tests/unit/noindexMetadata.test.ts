import { metadata as forgotPasswordMetadata } from '../../app/forgot-password/layout'
import { metadata as loginMetadata } from '../../app/login/layout'
import { metadata as registerMetadata } from '../../app/register/layout'
import { metadata as resetPasswordMetadata } from '../../app/reset-password/layout'

const noindexLayouts = [
  ['forgot-password', forgotPasswordMetadata],
  ['login', loginMetadata],
  ['register', registerMetadata],
  ['reset-password', resetPasswordMetadata],
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
