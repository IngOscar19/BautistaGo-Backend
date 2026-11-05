module.exports = {
<<<<<<< HEAD
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: ['src/domain/**/*.ts', '!src/domain/**/*.test.ts'],
=======
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  setupFiles: ['<rootDir>/tests/setup.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/http/gateways/**/*.ts',
    'src/infrastructure/websockets/**/*.ts',
  ],
>>>>>>> feature/BE-05-telemetry-gateway
};
