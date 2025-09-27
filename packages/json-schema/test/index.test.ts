import { assertSnapshot } from 'jsr:@std/testing/snapshot'
import { dataJSONSchemas } from '@targetd/json-schema'
import { data } from './fixtures/data.ts'

Deno.test('json schema for simple data object', async (t) => {
  await assertSnapshot(
    t,
    dataJSONSchemas(data),
  )
})
