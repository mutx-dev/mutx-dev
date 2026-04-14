// CommonJS mock for next-intl's ESM-only package.

module.exports = {
  useTranslations: jest.fn(() => (key => key)),
  useFormatter: jest.fn(() => ({
    dateTime: value => String(value),
    number: value => String(value),
    relativeTime: (value, unit) => `${value} ${unit}`,
  })),
  useLocale: jest.fn(() => 'en'),
  useMessages: jest.fn(() => ({})),
  useNow: jest.fn(() => new Date()),
  useTimeZone: jest.fn(() => 'UTC'),
  IntlError: class IntlError extends Error {
    constructor(code, message) {
      super(message)
      this.code = code
      this.name = 'IntlError'
    }
  },
  IntlErrorCode: {
    INVALID_MESSAGE: 'INVALID_MESSAGE',
    MISSING_MESSAGE: 'MISSING_MESSAGE',
    FETCH_ERROR: 'FETCH_ERROR',
    CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  },
  IntlProvider: jest.fn(({ children }) => children),
  NextIntlClientProvider: jest.fn(({ children }) => children),
}
