import type { $ZodType, output } from 'zod/v4/core'
import type { MaybePromise } from '../types.ts'

/**
 * Function that determines if a targeting rule matches a query.
 * Takes a query value and returns a function that tests targeting values.
 *
 * @template QV - Zod parser for the query value type.
 * @template TV - Zod parser for the targeting value type.
 * @template Query - Complete query object type.
 *
 * @example
 * ```ts
 * const predicate: TargetingPredicate<z.ZodString, z.ZodString> =
 *   (queryValue) => (targetValue) => queryValue === targetValue
 * ```
 */
type TargetingPredicate<
  QV extends $ZodType,
  TV extends $ZodType,
  Query extends Record<string, unknown> = {},
> = (
  queryValue: output<QV> | undefined,
  query: Query,
) => MaybePromise<(targeting: output<TV>) => MaybePromise<boolean>>

export default TargetingPredicate
