import z from 'zod'
import { MaybePromise } from '../types'

type TargetingPredicate<
  QV extends z.ZodTypeAny,
  TV extends z.ZodTypeAny,
  Query extends Record<string, unknown> = {},
> = (
  queryValue: z.infer<QV> | undefined,
  query: Query,
) => MaybePromise<(targeting: z.infer<TV>) => MaybePromise<boolean>>

export default TargetingPredicate
