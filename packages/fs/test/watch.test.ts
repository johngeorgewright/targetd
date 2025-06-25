import { expect } from 'jsr:@std/expect'
import * as path from 'node:path'
// @ts-types='npm:@types/fs-extra'
import { copy } from 'npm:fs-extra'
import { data } from './fixtures/data.ts'
import { createDisposableWatcher } from '../src/disposableWatcher.ts'

Deno.test('watch', async () => {
  await using dirTo = await createDisposableTempDir()
  const { promise, resolve } = Promise.withResolvers<void>()
  let initiated = false

  using _watcher = createDisposableWatcher(
    data,
    dirTo.path,
    async (error, data) => {
      if (!initiated) {
        initiated = true
        return
      }
      expect(error).toBeNull()
      expect(await data.getPayload('foo', {})).toBe('bar')
      expect(await data.getPayload('b', {})).toBe('b is a letter')
      resolve()
    },
  )

  copy(path.join(import.meta.dirname ?? '', 'fixtures', 'rules'), dirTo.path)

  await promise
})

async function createDisposableTempDir(): Promise<
  AsyncDisposable & { path: string }
> {
  const path = await Deno.makeTempDir()
  return {
    path,
    [Symbol.asyncDispose]: () => Deno.remove(path, { recursive: true }),
  }
}
