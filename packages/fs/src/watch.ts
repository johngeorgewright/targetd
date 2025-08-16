import type { DT } from '@targetd/api'
import { debounce, Mutex } from '@es-toolkit/es-toolkit'
import { type Options as WatchTreeOptions, unwatchTree, watchTree } from 'watch'
import { load, pathIsLoadable } from './load.ts'

export type OnLoad<D extends DT.Any> = (error: Error | null, data: D) => any

export function watch<D extends DT.Any>(
  data: D,
  dir: string,
  options: WatchTreeOptions,
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
  optionsOrOnLoad: WatchTreeOptions | OnLoad<D>,
  onLoadParam?: OnLoad<D>,
) {
  const options = onLoadParam ? optionsOrOnLoad : {}
  const onLoad = (onLoadParam || optionsOrOnLoad) as OnLoad<D>
  const mutex = new Mutex()

  watchTree(
    dir,
    {
      filter: pathIsLoadable,
      ...options,
    },
    debounce(
      async () => {
        await mutex.acquire()
        let error: Error | null = null
        try {
          data = await load(data.removeAllRules(), dir) as D
        } catch ($error: any) {
          error = $error
        } finally {
          releaseAndCallback(error, data)
        }
      },
      300,
    ),
  )

  const stop: WatchDisposer = () => unwatchTree(dir)

  return stop

  function releaseAndCallback(error: Error | null, data: D) {
    mutex.release()
    onLoad(error, data)
  }
}

interface WatchDisposer {
  (): void
}
