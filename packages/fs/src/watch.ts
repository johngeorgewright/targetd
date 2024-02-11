import { Data } from '@targetd/api'
import { debounce } from 'lodash'
import throat from 'throat'
import { Options as WatchTreeOptions, unwatchTree, watchTree } from 'watch'
import z from 'zod'
import { load, pathIsLoadable } from './load'

type Dirs =
  | string
  | {
      dataDir: string
      stateDir: string
    }

export type OnLoad<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape,
  FallThroughTargetingValidators extends z.ZodRawShape,
  StateValidators extends z.ZodRawShape,
  StateTargetingValidators extends z.ZodRawShape,
> = (
  error: Error | null,
  data: Data<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    FallThroughTargetingValidators,
    StateValidators,
    StateTargetingValidators
  >,
) => any

export function watch<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape,
  FallThroughTargetingValidators extends z.ZodRawShape,
  StateValidators extends z.ZodRawShape,
  StateTargetingValidators extends z.ZodRawShape,
>(
  data: Data<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    FallThroughTargetingValidators,
    StateValidators,
    StateTargetingValidators
  >,
  dirs: Dirs,
  options: WatchTreeOptions,
  onLoad: OnLoad<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    FallThroughTargetingValidators,
    StateValidators,
    StateTargetingValidators
  >,
): () => void

export function watch<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape,
  FallThroughTargetingValidators extends z.ZodRawShape,
  StateValidators extends z.ZodRawShape,
  StateTargetingValidators extends z.ZodRawShape,
>(
  data: Data<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    FallThroughTargetingValidators,
    StateValidators,
    StateTargetingValidators
  >,
  dirs: Dirs,
  onLoad: OnLoad<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    FallThroughTargetingValidators,
    StateValidators,
    StateTargetingValidators
  >,
): () => void

export function watch<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape,
  FallThroughTargetingValidators extends z.ZodRawShape,
  StateValidators extends z.ZodRawShape,
  StateTargetingValidators extends z.ZodRawShape,
>(
  data: Data<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    FallThroughTargetingValidators,
    StateValidators,
    StateTargetingValidators
  >,
  dirs: Dirs,
  optionsOrOnLoad:
    | WatchTreeOptions
    | OnLoad<
        DataValidators,
        TargetingValidators,
        QueryValidators,
        FallThroughTargetingValidators,
        StateValidators,
        StateTargetingValidators
      >,
  onLoadParam?: OnLoad<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    FallThroughTargetingValidators,
    StateValidators,
    StateTargetingValidators
  >,
) {
  const dataDir = typeof dirs === 'string' ? dirs : dirs.dataDir
  const stateDir = typeof dirs === 'object' ? dirs.stateDir : undefined
  const options = onLoadParam ? optionsOrOnLoad : {}
  const onLoad = (onLoadParam || optionsOrOnLoad) as OnLoad<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    FallThroughTargetingValidators,
    StateValidators,
    StateTargetingValidators
  >

  const handleChange = debounce(
    throat(1, async () => {
      try {
        data = await load(data.removeAllRules(), dataDir)
      } catch (error: any) {
        return onLoad(error, data)
      }

      onLoad(null, data)
    }),
    300,
  )

  const watchOptions = {
    filter: pathIsLoadable,
    ...options,
  }

  if (stateDir) watchTree(stateDir, watchOptions, handleChange)

  watchTree(dataDir, watchOptions, handleChange)

  return () => {
    if (stateDir) unwatchTree(stateDir)
    unwatchTree(dataDir)
  }
}
