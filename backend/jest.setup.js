/**
 * Jest Setup File
 * Runs before each test suite
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Mock console methods to reduce noise (optional)
global.console = {
  ...console,
  // Uncomment to suppress logs during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test timeout
jest.setTimeout(10000);

// Clean up after all tests
afterAll(async () => {
  // Give time for async cleanup
  await new Promise(resolve => setTimeout(resolve, 500));
});
