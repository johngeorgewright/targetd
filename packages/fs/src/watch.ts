import type { DT } from '@targetd/api'
import { debounce } from 'lodash'
import throat from 'throat'
import { type Options as WatchTreeOptions, unwatchTree, watchTree } from 'watch'
import { load, pathIsLoadable } from './load'

export type OnLoad<D extends DT.Any> = (error: Error | null, data: D) => any

export function watch<D extends DT.Any>(
  data: D,
  dir: string,
  options: WatchTreeOptions,
  onLoad: OnLoad<D>,
): () => void

export function watch<D extends DT.Any>(
  data: D,
  dir: string,
  onLoad: OnLoad<D>,
): () => void

export function watch<D extends DT.Any>(
  data: D,
  dir: string,
  optionsOrOnLoad: WatchTreeOptions | OnLoad<D>,
  onLoadParam?: OnLoad<D>,
) {
  const options = onLoadParam ? optionsOrOnLoad : {}
  const onLoad = (onLoadParam || optionsOrOnLoad) as OnLoad<D>

  watchTree(
    dir,
    {
      filter: pathIsLoadable,
      ...options,
    },
    debounce(
      throat(1, async () => {
        try {
          data = (await load(data.removeAllRules(), dir)) as D
        } catch (error: any) {
          return onLoad(error, data)
        }

        onLoad(null, data)
      }),
      300,
    ),
  )

  return () => unwatchTree(dir)
}
