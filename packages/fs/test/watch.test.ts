import { afterEach, beforeEach, test } from 'jsr:@std/testing/bdd'
import { expect } from 'jsr:@std/expect'
import * as path from 'node:path'
// @ts-types='npm:@types/fs-extra'
import { copy, emptyDir } from 'npm:fs-extra'
import { watch } from '@targetd/fs'
import { data } from './fixtures/data.ts'

let stopWatching: undefined | (() => void)
let dirTo: string

beforeEach(async () => {
  dirTo = await Deno.makeTempDir()
  await emptyDir(dirTo)
})

afterEach(async () => {
  stopWatching?.()
  await Deno.remove(dirTo)
})

test('watch', () => {
  let initiated = false
  const { promise, resolve } = Promise.withResolvers<void>()

  stopWatching = watch(data, dirTo, async (error, data) => {
    if (!initiated) {
      initiated = true
      return
    }
    expect(error).toBeNull()
    expect(await data.getPayload('foo', {})).toBe('bar')
    expect(await data.getPayload('b', {})).toBe('b is a letter')
    resolve()
  })

  copy(path.join(import.meta.dirname ?? '', 'fixtures', 'rules'), dirTo)

  return promise
})
