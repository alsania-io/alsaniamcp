/**
 * Jest config — CommonJS mode (ts-jest).
 *
 * NOTE: package.json has "type": "module", so this MUST be .cjs (a .js file
 * would be parsed as ESM and `module.exports` would fail).
 *
 * Previously there were TWO identical configs (.js + .cjs) which made jest
 * fail with "Multiple configurations found". This is the single source of truth.
 *
 * ts-jest is run in CJS (not useESM) for maximum compatibility with
 * jest 30 + ts-jest 29; TS sources are transpiled per-file.
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'CommonJS',
        moduleResolution: 'node',
        esModuleInterop: true,
        allowJs: true,
      },
      diagnostics: { ignoreCodes: [151002, 1343] },
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    // NodeNext sources import './x.js' but the file is ./x.ts
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Resolve extensionless relative imports by trying .ts/.tsx first.
  moduleDirectories: ['node_modules', '<rootDir>'],
  modulePaths: ['<rootDir>/src'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!dist/**/*',
    '!node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};