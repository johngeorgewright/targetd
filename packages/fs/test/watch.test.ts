import { expect } from 'jsr:@std/expect'
import * as path from 'node:path'
// @ts-types='npm:@types/fs-extra'
import { copy } from 'npm:fs-extra'
import { watch } from '@targetd/fs'
import { data } from './fixtures/data.ts'

Deno.test('watch', async (t) => {
  const dirTo = await Deno.makeTempDir()
  let stopWatching: undefined | (() => void)

  await t.step('data is updated when files are changed', () => {
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

  await t.step('cleanup', async () => {
    stopWatching?.()
    await Deno.remove(dirTo, { recursive: true })
  })
})
