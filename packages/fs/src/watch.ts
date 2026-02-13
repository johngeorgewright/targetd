import type { DT } from '@targetd/api'
import { debounce, Mutex } from '@es-toolkit/es-toolkit'
import { watch as fsWatch, type WatchOptions } from 'node:fs'
import { load, pathIsLoadable } from './load.ts'

export type OnLoad<D extends DT.Any> = (error: Error | null, data: D) => any

/**
 * Watch a directory for rule file changes and automatically reload.
 * Provides hot-reloading of targeting rules without restarting the application.
 *
 * @param data - Base Data instance with payloads and targeting configured.
 * @param dir - Directory path to watch for rule files.
 * @param options - Node.js fs.watch options (optional).
 * @param onLoad - Callback invoked when rules are loaded or reloaded.
 * @returns Function to stop watching the directory.
 *
 * @example
 * ```ts
 * import { Data, targetIncludes } from '@targetd/api'
 * import { watch } from '@targetd/fs'
 * import { z } from 'zod'
 *
 * const baseData = await Data.create()
 *   .usePayload({ greeting: z.string() })
 *   .useTargeting({ country: targetIncludes(z.string()) })
 *
 * let currentData = baseData
 *
 * const stopWatching = watch(baseData, './rules', (error, data) => {
 *   if (error) {
 *     console.error('Failed to reload rules:', error)
 *   } else {
 *     currentData = data
 *     console.log('Rules reloaded successfully')
 *   }
 * })
 *
 * // Later: stop watching
 * stopWatching()
 * ```
 */
export function watch<D extends DT.Any>(
  data: D,
  dir: string,
  options: WatchOptions,
  onLoad: OnLoad<D>,
): WatchDisposer

export function watch<D extends DT.Any>(
  data: D,
  dir: string,
  onLoad: OnLoad<D>,
): WatchDisposer

export function watch<D extends DT.Any>(
  data: D,
  dir: string,
  optionsOrOnLoad: WatchOptions | OnLoad<D>,
  onLoadParam?: OnLoad<D>,
) {
  const options = onLoadParam ? optionsOrOnLoad as WatchOptions : {}
  const onLoad = (onLoadParam || optionsOrOnLoad) as OnLoad<D>
  const mutex = new Mutex()

  const onChange = async () => {
    await mutex.acquire()
    let error: Error | null = null
    try {
      data = await load(data.removeAllRules(), dir) as D
    } catch ($error: any) {
      error = $error
    } finally {
      mutex.release()
      onLoad(error, data)
    }
  }

  const watcher = fsWatch(
    dir,
    options,
    debounce(
      async (_eventType, filename) => {
        if (filename && !pathIsLoadable(filename)) return
        await onChange()
      },
      300,
    ),
  )

  const stop: WatchDisposer = () => watcher.close()

  onChange()

  return stop
}

interface WatchDisposer {
  (): void
}
