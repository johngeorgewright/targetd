import type { output, ZodTypeAny } from 'zod'
import type { MaybePromise } from '../types.ts'

type TargetingPredicate<
  QV extends ZodTypeAny,
  TV extends ZodTypeAny,
  Query extends Record<string, unknown> = {},
> = (
  queryValue: output<QV> | undefined,
  query: Query,
) => MaybePromise<(targeting: output<TV>) => MaybePromise<boolean>>

export default TargetingPredicate
