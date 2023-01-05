import { Data } from '@targetd/api'
import * as path from 'node:path'
import z from 'zod'
import { load } from '../src'

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
