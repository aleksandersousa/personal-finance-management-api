module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: [
    "src/**/*.(t|j)s",
    "!src/**/*.spec.ts",
    "!src/**/*.interface.ts",
    "!src/**/*.module.ts",
    "!src/main.ts",
  ],
  coverageDirectory: "./coverage",
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@domain/(.*)$": "<rootDir>/src/domain/$1",
    "^@data/(.*)$": "<rootDir>/src/data/$1",
    "^@infra/(.*)$": "<rootDir>/src/infra/$1",
    "^@presentation/(.*)$": "<rootDir>/src/presentation/$1",
    "^@main/(.*)$": "<rootDir>/src/main/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
