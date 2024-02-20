import { type infer as zInfer, type ZodTypeAny } from 'zod'
import { type MaybePromise } from '../types'

type TargetingPredicate<
  QV extends ZodTypeAny,
  TV extends ZodTypeAny,
  Query extends Record<string, unknown> = {},
> = (
  queryValue: zInfer<QV> | undefined,
  query: Query,
) => MaybePromise<(targeting: zInfer<TV>) => MaybePromise<boolean>>

export default TargetingPredicate
