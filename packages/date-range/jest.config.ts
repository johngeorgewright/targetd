import { InitialOptionsTsJest } from 'ts-jest'

const config: InitialOptionsTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['jest-date-mock'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
    },
  },
}

export default config
