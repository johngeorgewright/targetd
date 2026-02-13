import type { DT } from '@targetd/api'
import { debounce, Mutex } from '@es-toolkit/es-toolkit'
import { watch as fsWatch, type WatchOptions } from 'node:fs'
import { load, pathIsLoadable } from './load.ts'

/**
 * Callback function invoked when rules are loaded or reloaded by the watch function.
 *
 * @template D - Data instance type being watched.
 *
 * @param error - Error object if loading failed, null if successful.
 * @param data - The Data instance with loaded rules (may be unchanged if error occurred).
 * @returns Any value (typically void or a cleanup function).
 *
 * @example
 * ```ts
 * const onLoad: OnLoad<typeof myData> = (error, data) => {
 *   if (error) {
 *     console.error('Failed to load rules:', error)
 *   } else {
 *     console.log('Rules loaded successfully')
 *     // Update application state with new data
 *   }
 * }
 * ```
 */
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

/**
 * Function type that stops watching a directory.
 * Call this function to clean up the file watcher and stop monitoring for changes.
 */
export interface WatchDisposer {
  (): void
}
