import type { ZodTypeAny } from 'zod'
import type TargetingPredicate from './TargetingPredicate.ts'

export default interface TargetingDescriptor<
  TV extends ZodTypeAny,
  QV extends ZodTypeAny,
  Query extends Record<string, any> = {},
> {
  predicate: TargetingPredicate<QV, TV, Query>
  queryParser: QV
  requiresQuery?: boolean
  targetingParser: TV
}

export function isTargetingDescriptor<
  TV extends ZodTypeAny,
  QV extends ZodTypeAny,
>(x: unknown): x is TargetingDescriptor<TV, QV, any> {
  return (
    typeof x === 'object' &&
    x !== null &&
    'predicate' in x &&
    'queryParser' in x &&
    'targetingParser' in x
  )
}
