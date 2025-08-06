import { assertStrictEquals } from 'jsr:@std/assert'
import * as path from 'node:path'
import { copy } from 'jsr:@std/fs/copy'
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

  copy(path.join(import.meta.dirname ?? '', 'fixtures', 'rules'), dirTo, {
    overwrite: true,
  })

  await promise
})

function onlySubsequentCalls<Args extends unknown[]>(
  fn: (...args: Args) => Promise<void>,
) {
  let $fn: (...args: Args) => Promise<void> = () => {
    $fn = fn
    return Promise.resolve()
  }
  return (...args: Args) => $fn(...args)
}
