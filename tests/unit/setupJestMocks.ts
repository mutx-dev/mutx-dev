// Jest setup file that automatically mocks next-intl
// This resolves the ESM/CommonJS incompatibility when ts-jest transforms
// modules that transitively import from next-intl.

jest.mock('next-intl');
