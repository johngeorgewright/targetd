import type { $ZodType } from 'zod/v4/core'
import type TargetingPredicate from './TargetingPredicate.ts'
import type { ZodMiniUnknown } from 'zod/mini'

export interface TargetingDescriptorInput<
  TV extends $ZodType,
  QV extends $ZodType = ZodMiniUnknown,
  Query extends Record<string, any> = {},
> {
  /**
   * The assertion that a query can match the targeting.
   *
   * @example
   * ```
   * (query) => (targeting) => targeting === query
   * ```
   */
  predicate: TargetingPredicate<QV, TV, Query>

  /**
   * Validate a query parameter before it reaches the predicate.
   *
   * @default ZodMiniUnknown
   */
  queryParser?: QV

  /**
   * Whether the query property has to exist for the predicate
   * to even run.
   *
   * @default true
   */
  requiresQuery?: boolean

  /**
   * Validate targeting before it's stored.
   */
  targetingParser: TV
}

/**
 * Instructions on a targeting field.
 */
type TargetingDescriptor<
  TV extends $ZodType,
  QV extends $ZodType,
  Query extends Record<string, any>,
> = Required<TargetingDescriptorInput<TV, QV, Query>>

export default TargetingDescriptor

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
