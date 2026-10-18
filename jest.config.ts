import type { Config } from 'jest';

const config: Config = {
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
};

export default config;
