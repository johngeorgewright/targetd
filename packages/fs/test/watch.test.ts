import * as path from 'node:path'
import { emptyDir, copy } from 'fs-extra'
import { watch } from '../src'
import { data } from './fixtures/data'

let stopWatching: undefined | (() => void)

const dirTo = path.join(__dirname, 'fixtures-watch')

jest.setTimeout(10_000)

beforeEach(async () => {
  await emptyDir(dirTo)
})

afterEach(async () => {
  stopWatching?.()
  await emptyDir(dirTo)
})

test('watch', (done) => {
  let initiated = false

  stopWatching = watch(data, dirTo, async (error, data) => {
    if (!initiated) {
      initiated = true
      return
    }
    expect(error).toBeNull()
    expect(await data.getPayload('foo', {})).toBe('bar')
    expect(await data.getPayload('b', {})).toBe('b is a letter')
    done()
  })

  copy(path.join(__dirname, 'fixtures'), dirTo)
})
