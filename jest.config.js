module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.spec.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
    // Exclude files that don't need testing
    '!src/main/factories/**', // Factories are DI containers
    '!src/main/config/**', // Simple config files
    '!src/infra/db/typeorm/config/**', // Database configuration
    '!src/infra/db/typeorm/entities/**', // Entities are data structures
    '!src/presentation/dtos/**', // DTOs are data structures
    '!src/presentation/decorators/**', // Simple decorators
    '!src/infra/implementations/uuid-generator.ts', // Simple wrapper
    // Exclude unimplemented user stories
    '!src/infra/db/typeorm/repositories/typeorm-category.repository.ts', // Categories not implemented yet
    // Exclude index.ts files and migrations from coverage
    '!src/**/index.ts', // Index files are just re-exports
    '!src/infra/db/typeorm/migrations/**', // Migrations are database schema changes
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@data/(.*)$': '<rootDir>/src/data/$1',
    '^@infra/(.*)$': '<rootDir>/src/infra/$1',
    '^@presentation/(.*)$': '<rootDir>/src/presentation/$1',
    '^@main/(.*)$': '<rootDir>/src/main/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
