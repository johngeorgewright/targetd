import { load } from '../src'
import * as path from 'path'
import { data } from './fixtures/data'

test('load', async () => {
  const $data = await load(data, path.join(__dirname, 'fixtures'))
  expect(await $data.getPayload('foo', {})).toBe('bar')
  expect(await $data.getPayload('b', {})).toBe('b is a letter')
})
