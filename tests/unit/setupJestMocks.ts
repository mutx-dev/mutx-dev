// Jest setup file that automatically mocks next-intl.
// This avoids ESM parse failures when ts-jest reaches client components.

jest.mock('next-intl')
