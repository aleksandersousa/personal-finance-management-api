import 'reflect-metadata';

// Global test setup
beforeAll(() => {
  // Configure timezone for consistent test results
  process.env.TZ = 'UTC';
});

// Mock console methods in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}; 