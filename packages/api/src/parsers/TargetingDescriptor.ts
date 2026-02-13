import type { $ZodType } from 'zod/v4/core'
import type TargetingPredicate from './TargetingPredicate.ts'

/**
 * Configuration for a targeting field that defines how to parse and evaluate targeting conditions.
 *
 * @template TV - Zod parser for the targeting value type.
 * @template QV - Zod parser for the query value type.
 * @template Query - Complete query object type.
 */
export default interface TargetingDescriptor<
  TV extends $ZodType,
  QV extends $ZodType,
  Query extends Record<string, any> = {},
> {
  predicate: TargetingPredicate<QV, TV, Query>
  queryParser: QV
  requiresQuery?: boolean
  targetingParser: TV
}

/**
 * Targeting descriptor guard
 */
export function isTargetingDescriptor<
  TV extends $ZodType,
  QV extends $ZodType,
>(x: unknown): x is TargetingDescriptor<TV, QV, any> {
  return (
    typeof x === 'object' &&
    x !== null &&
    'predicate' in x &&
    'queryParser' in x &&
    'targetingParser' in x
  )
}
