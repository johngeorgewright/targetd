import { type Data } from '@targetd/api'
import { debounce } from 'lodash'
import throat from 'throat'
import { type Options as WatchTreeOptions, unwatchTree, watchTree } from 'watch'
import { load, pathIsLoadable } from './load'
import { type ZodRawShape } from 'zod'

export type OnLoad<
  DataParsers extends ZodRawShape,
  TargetingParsers extends ZodRawShape,
  QueryParsers extends ZodRawShape,
  FallThroughTargetingParsers extends ZodRawShape,
> = (
  error: Error | null,
  data: Data<
    DataParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  >,
) => any

export function watch<
  DataParsers extends ZodRawShape,
  TargetingParsers extends ZodRawShape,
  QueryParsers extends ZodRawShape,
  FallThroughTargetingParsers extends ZodRawShape,
>(
  data: Data<
    DataParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  >,
  dir: string,
  options: WatchTreeOptions,
  onLoad: OnLoad<
    DataParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  >,
): () => void

export function watch<
  DataParsers extends ZodRawShape,
  TargetingParsers extends ZodRawShape,
  QueryParsers extends ZodRawShape,
  FallThroughTargetingParsers extends ZodRawShape,
>(
  data: Data<
    DataParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  >,
  dir: string,
  onLoad: OnLoad<
    DataParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  >,
): () => void

export function watch<
  DataParsers extends ZodRawShape,
  TargetingParsers extends ZodRawShape,
  QueryParsers extends ZodRawShape,
  FallThroughTargetingParsers extends ZodRawShape,
>(
  data: Data<
    DataParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  >,
  dir: string,
  optionsOrOnLoad:
    | WatchTreeOptions
    | OnLoad<
        DataParsers,
        TargetingParsers,
        QueryParsers,
        FallThroughTargetingParsers
      >,
  onLoadParam?: OnLoad<
    DataParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  >,
) {
  const options = onLoadParam ? optionsOrOnLoad : {}
  const onLoad = (onLoadParam || optionsOrOnLoad) as OnLoad<
    DataParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
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
