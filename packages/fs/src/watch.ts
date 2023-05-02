import { Data } from '@targetd/api'
import { debounce } from 'lodash'
import throat from 'throat'
import { Options as WatchTreeOptions, unwatchTree, watchTree } from 'watch'
import z from 'zod'
import { load, pathIsLoadable } from './load'

export type OnLoad<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape,
  ClientTargetingValidators extends z.ZodRawShape
> = (
  error: Error | null,
  data: Data<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    ClientTargetingValidators
  >
) => any

export function watch<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape,
  ClientTargetingValidators extends z.ZodRawShape
>(
  data: Data<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    ClientTargetingValidators
  >,
  dir: string,
  options: WatchTreeOptions,
  onLoad: OnLoad<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    ClientTargetingValidators
  >
): () => void

export function watch<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape,
  ClientTargetingValidators extends z.ZodRawShape
>(
  data: Data<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    ClientTargetingValidators
  >,
  dir: string,
  onLoad: OnLoad<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    ClientTargetingValidators
  >
): () => void

export function watch<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape,
  ClientTargetingValidators extends z.ZodRawShape
>(
  data: Data<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    ClientTargetingValidators
  >,
  dir: string,
  optionsOrOnLoad:
    | WatchTreeOptions
    | OnLoad<
        DataValidators,
        TargetingValidators,
        QueryValidators,
        ClientTargetingValidators
      >,
  onLoadParam?: OnLoad<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    ClientTargetingValidators
  >
) {
  const options = onLoadParam ? optionsOrOnLoad : {}
  const onLoad = (onLoadParam || optionsOrOnLoad) as OnLoad<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    ClientTargetingValidators
  >

  watchTree(
    dir,
    {
      filter: pathIsLoadable,
      ...options,
    },
    debounce(
      throat(1, async () => {
        try {
          data = await load(data.removeAllRules(), dir)
        } catch (error: any) {
          return onLoad(error, data)
        }

        onLoad(null, data)
      }),
      300
    )
  )

  return () => unwatchTree(dir)
}
