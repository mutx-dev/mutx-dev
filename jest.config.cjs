module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/unit'],
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  modulePathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
}
