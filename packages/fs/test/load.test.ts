import * as path from 'node:path'
import { load } from '../src'
import { data } from './fixtures/data'

test('load', async () => {
  const $data = await load(data, path.join(__dirname, 'fixtures', 'rules'))
  expect(await $data.getPayload('foo')).toBe('bar')
  expect(await $data.getPayload('b')).toBe('b is a letter')
})
