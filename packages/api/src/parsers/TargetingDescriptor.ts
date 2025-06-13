import type { $ZodType } from 'zod/v4/core'
import type TargetingPredicate from './TargetingPredicate.ts'

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
