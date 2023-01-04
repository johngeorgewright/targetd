import { load } from '../src'
import * as path from 'path'
import { Data, zod as z } from '@targetd/api'

test('load', async () => {
  const data = await load(
    Data.create()
      .useDataValidator('foo', z.string())
      .useDataValidator('b', z.string()),
    path.join(__dirname, 'fixtures')
  )
  expect(await data.getPayload('foo', {})).toBe('bar')
  expect(await data.getPayload('b', {})).toBe('b is a letter')
})
