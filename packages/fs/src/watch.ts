import { Data, zod as z } from '@targetd/api'
import { debounce } from 'lodash'
import { Options as WatchTreeOptions, unwatchTree, watchTree } from 'watch'
import { load, pathIsLoadable } from './load'

export function watch<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape
>(
  data: Data<DataValidators, TargetingValidators, QueryValidators>,
  dir: string,
  onLoad: (
    error: Error | null,
    data: Data<DataValidators, TargetingValidators, QueryValidators>
  ) => any,
  options: WatchTreeOptions = {}
) {
  watchTree(
    dir,
    {
      filter: pathIsLoadable,
      ...options,
    },
    debounce(async () => {
      try {
        data = await load(data.removeAllRules(), dir)
      } catch (error: any) {
        return onLoad(error, data)
      }

      onLoad(null, data)
    }, 300)
  )

  return () => unwatchTree(dir)
}
