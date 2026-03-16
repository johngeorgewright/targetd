import { test, expect } from 'bun:test'
import { dataJSONSchemas } from '@targetd/json-schema'
import { data } from './fixtures/data.ts'

test('json schema for simple data object', async () => {
  expect(dataJSONSchemas(data)).toMatchSnapshot()
})
