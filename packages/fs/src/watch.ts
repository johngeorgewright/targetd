import type { DT } from '@targetd/api'
import { debounce, Mutex } from '@es-toolkit/es-toolkit'
import { watch as fsWatch, type WatchOptions } from 'node:fs'
import { load, pathIsLoadable } from './load.ts'

export type OnLoad<D extends DT.Any> = (error: Error | null, data: D) => any

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
        if (!pathIsLoadable(filename)) return
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
