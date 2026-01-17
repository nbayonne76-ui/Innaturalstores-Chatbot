/**
 * Jest Configuration
 * Phase 4: Testing & CI/CD
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Coverage directory
  coverageDirectory: 'coverage',

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html', 'json'],

  // Files to collect coverage from
  collectCoverageFrom: [
    'middleware/**/*.js',
    'services/**/*.js',
    'utils/**/*.js',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!coverage/**',
  ],

  // Coverage thresholds
  coverageThresholds: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js',
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Module paths
  modulePaths: ['<rootDir>'],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
  ],

  // Verbose output
  verbose: true,

  // Timeout
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Transform files with babel-jest
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
};
