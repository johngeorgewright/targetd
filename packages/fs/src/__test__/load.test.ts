import { load } from '..'
import * as path from 'path'
import { Data, runtypes as rt } from '@targetd/api'

test('load', async () => {
  const data = await load(
    Data.create()
      .useDataValidator('foo', rt.String)
      .useDataValidator('b', rt.String),
    path.join(__dirname, 'fixtures')
  )
  expect(await data.getPayload('foo', {})).toBe('bar')
  expect(await data.getPayload('b', {})).toBe('b is a letter')
})
