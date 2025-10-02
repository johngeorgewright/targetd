import { assertStrictEquals } from 'jsr:@std/assert'
import { setTimeout } from 'node:timers/promises'
import * as path from 'node:path'
import { copy } from 'jsr:@std/fs/copy'
import { data } from './fixtures/data.ts'
import { watch } from '@targetd/fs'

Deno.test('watch', async () => {
  const { promise, reject, resolve } = Promise.withResolvers<void>()

  await using disposable = new AsyncDisposableStack()

  const dirTo = disposable.adopt(
    await Deno.makeTempDir(),
    (path) => Deno.remove(path, { recursive: true }),
  )

  let firstCall = true

  disposable.adopt(
    watch(
      data,
      dirTo,
      async (error, data) => {
        if (firstCall) {
          firstCall = false
          await setTimeout(100)
          copy(
            path.join(import.meta.dirname ?? '', 'fixtures', 'rules'),
            dirTo,
            {
              overwrite: true,
            },
          )
        } else {
          try {
            assertStrictEquals(error, null)
            assertStrictEquals(await data.getPayload('foo', {}), 'bar')
            assertStrictEquals(await data.getPayload('b', {}), 'b is a letter')
          } catch (error) {
            return reject(error)
          }
          resolve()
        }
      },
    ),
    (stopWatching) => stopWatching(),
  )

  await promise
})
