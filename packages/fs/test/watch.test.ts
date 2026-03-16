import { test, expect } from 'bun:test'
import { setTimeout } from 'node:timers/promises'
import * as path from 'node:path'
import { cp, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { data } from './fixtures/data.ts'
import { watch } from '@targetd/fs'

test('watch', async () => {
  const { promise, reject, resolve } = Promise.withResolvers<void>()

  await using disposable = new AsyncDisposableStack()

  const dirTo = disposable.adopt(await mkdtemp(path.join(tmpdir(), 'targetd-')), (path) =>
    rm(path, { recursive: true }),
  )

  let firstCall = true

  disposable.adopt(
    watch(data, dirTo, async (error, data) => {
      if (firstCall) {
        firstCall = false
        await setTimeout(100)
        cp(path.join(import.meta.dirname ?? '', 'fixtures', 'rules'), dirTo, {
          recursive: true,
          force: true,
        })
      } else {
        try {
          expect(error).toBe(null)
          expect(await data.getPayload('foo', {})).toBe('bar')
          expect(await data.getPayload('b', {})).toBe('b is a letter')
        } catch (error) {
          return reject(error)
        }
        resolve()
      }
    }),
    (stopWatching) => stopWatching(),
  )

  await promise
})
