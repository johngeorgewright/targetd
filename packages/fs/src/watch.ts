import { type Data } from '@targetd/api'
import { debounce } from 'lodash'
import throat from 'throat'
import { type Options as WatchTreeOptions, unwatchTree, watchTree } from 'watch'
import { load, pathIsLoadable } from './load'
import { type ZodRawShape } from 'zod'

export type OnLoad<
  DataValidators extends ZodRawShape,
  TargetingValidators extends ZodRawShape,
  QueryValidators extends ZodRawShape,
  FallThroughTargetingValidators extends ZodRawShape,
> = (
  error: Error | null,
  data: Data<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    FallThroughTargetingValidators
  >,
) => any

export function watch<
  DataValidators extends ZodRawShape,
  TargetingValidators extends ZodRawShape,
  QueryValidators extends ZodRawShape,
  FallThroughTargetingValidators extends ZodRawShape,
>(
  data: Data<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    FallThroughTargetingValidators
  >,
  dir: string,
  options: WatchTreeOptions,
  onLoad: OnLoad<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    FallThroughTargetingValidators
  >,
): () => void

export function watch<
  DataValidators extends ZodRawShape,
  TargetingValidators extends ZodRawShape,
  QueryValidators extends ZodRawShape,
  FallThroughTargetingValidators extends ZodRawShape,
>(
  data: Data<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    FallThroughTargetingValidators
  >,
  dir: string,
  onLoad: OnLoad<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    FallThroughTargetingValidators
  >,
): () => void

export function watch<
  DataValidators extends ZodRawShape,
  TargetingValidators extends ZodRawShape,
  QueryValidators extends ZodRawShape,
  FallThroughTargetingValidators extends ZodRawShape,
>(
  data: Data<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    FallThroughTargetingValidators
  >,
  dir: string,
  optionsOrOnLoad:
    | WatchTreeOptions
    | OnLoad<
        DataValidators,
        TargetingValidators,
        QueryValidators,
        FallThroughTargetingValidators
      >,
  onLoadParam?: OnLoad<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    FallThroughTargetingValidators
  >,
) {
  const options = onLoadParam ? optionsOrOnLoad : {}
  const onLoad = (onLoadParam || optionsOrOnLoad) as OnLoad<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    FallThroughTargetingValidators
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
      300,
    ),
  )

  return () => unwatchTree(dir)
}
