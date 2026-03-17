import { test, expect } from 'bun:test'
import * as path from 'node:path'
import { load } from '@targetd/fs'
import { data } from './fixtures/data.js'

test('load', async () => {
  const $data = await load(data, path.join(import.meta.dirname ?? '', 'fixtures', 'rules'))
  expect(await $data.getPayload('foo')).toBe('bar')
  expect(await $data.getPayload('b')).toBe('b is a letter')
})
