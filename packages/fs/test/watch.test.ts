import { expect } from 'jsr:@std/expect'
import * as path from 'node:path'
// @ts-types='npm:@types/fs-extra'
import { copy } from 'npm:fs-extra'
import { data } from './fixtures/data.ts'
import { watch } from '@targetd/fs'

Deno.test('watch', async () => {
  await using dirTo = await createDisposableTempDir()
  const { promise, resolve } = Promise.withResolvers<void>()

  using _watcher = watch(
    data,
    dirTo.path,
    onlySubsequentCalls(async (error, data) => {
      expect(error).toBeNull()
      expect(await data.getPayload('foo', {})).toBe('bar')
      expect(await data.getPayload('b', {})).toBe('b is a letter')
      resolve()
    }),
  )

  copy(path.join(import.meta.dirname ?? '', 'fixtures', 'rules'), dirTo.path)

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

async function createDisposableTempDir(): Promise<DisposableTempDir> {
  const dispose: DisposableTempDir = () =>
    Deno.remove(dispose.path, { recursive: true })
  dispose.path = await Deno.makeTempDir()
  dispose[Symbol.asyncDispose] = dispose
  return dispose
}

interface DisposableTempDir extends AsyncDisposable {
  (): Promise<void>
  path: string
}
