import { JestConfigWithTsJest } from 'ts-jest'

const config: JestConfigWithTsJest = {
  prettierPath: require.resolve('prettier-2'),
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'test/tsconfig.json' }],
  },
}

export default config
