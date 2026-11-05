import type { Config } from 'jest';

const config: Config = {
<<<<<<< HEAD
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  setupFiles: ['dotenv/config'],
  // Los tests validan comportamiento en runtime; el typecheck completo lo da
  // `npm run build` (hay errores preexistentes de BE-02/BE-07 que se corrigen
  // en sus propias ramas y no deben bloquear esta suite).
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { diagnostics: false }],
  },
=======
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
  clearMocks: true,
>>>>>>> feature/BE-01-project-scaffold
};

export default config;
