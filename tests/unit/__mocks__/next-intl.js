// CommonJS mock for next-intl ESM-only package
// This allows ts-jest (running in CommonJS mode) to resolve next-intl without
// hitting the ESM export syntax error.

module.exports = {
  useTranslations: jest.fn(() => ({
    t: (key, _params) => key,
  })),
  useFormatter: jest.fn(() => ({
    dateTime: (value, _options) => String(value),
    number: (value, _options) => String(value),
    relativeTime: (value, unit, _options) => `${value} ${unit}`,
  })),
  useLocale: jest.fn(() => 'en'),
  useMessages: jest.fn(() => ({})),
  useNow: jest.fn(() => new Date()),
  useTimeZone: jest.fn(() => 'UTC'),
  IntlError: class IntlError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
      this.name = 'IntlError';
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
};
