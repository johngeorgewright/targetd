import { assertStrictEquals } from 'jsr:@std/assert'
import * as path from 'node:path'
// @ts-types='npm:@types/fs-extra'
import { copy } from 'npm:fs-extra'
import { data } from './fixtures/data.ts'
import { watch } from '@targetd/fs'

Deno.test('watch', async () => {
  const { promise, resolve } = Promise.withResolvers<void>()

  await using disposable = new AsyncDisposableStack()

  const dirTo = disposable.adopt(
    await Deno.makeTempDir(),
    (path) => Deno.remove(path, { recursive: true }),
  )

  disposable.adopt(
    watch(
      data,
      dirTo,
      onlySubsequentCalls(async (error, data) => {
        assertStrictEquals(error, null)
        assertStrictEquals(await data.getPayload('foo', {}), 'bar')
        assertStrictEquals(await data.getPayload('b', {}), 'b is a letter')
        resolve()
      }),
    ),
    (stopWatching) => stopWatching(),
  )

  copy(path.join(import.meta.dirname ?? '', 'fixtures', 'rules'), dirTo)

  await promise
})

function onlySubsequentCalls<Args extends unknown[]>(
  fn: (...args: Args) => Promise<void>,
) {
  let firstCall = false
  return (...args: Args) => {
    if (!firstCall) {
      firstCall = true
      return
    }
    return fn(...args)
  }
}
