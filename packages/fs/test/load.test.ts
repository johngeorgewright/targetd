import { assertStrictEquals } from 'jsr:@std/assert'
import * as path from 'node:path'
import { load } from '@targetd/fs'
import { data } from './fixtures/data.ts'

Deno.test('load', async () => {
  const $data = await load(
    data,
    path.join(import.meta.dirname ?? '', 'fixtures', 'rules'),
  )
  assertStrictEquals(await $data.getPayload('foo'), 'bar')
  assertStrictEquals(await $data.getPayload('b'), 'b is a letter')
})
