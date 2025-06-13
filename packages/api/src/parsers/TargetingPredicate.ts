import type { $ZodType, output } from 'zod/v4/core'
import type { MaybePromise } from '../types.ts'

type TargetingPredicate<
  QV extends $ZodType,
  TV extends $ZodType,
  Query extends Record<string, unknown> = {},
> = (
  queryValue: output<QV> | undefined,
  query: Query,
) => MaybePromise<(targeting: output<TV>) => MaybePromise<boolean>>

export default TargetingPredicate
