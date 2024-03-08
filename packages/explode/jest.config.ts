import { JestConfigWithTsJest } from 'ts-jest'

const config: JestConfigWithTsJest = {
  prettierPath: null,
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'test/tsconfig.json' }],
  },
}

export default config
