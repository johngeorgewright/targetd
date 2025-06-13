import type TargetingPredicate from '../parsers/TargetingPredicate.ts'
import type TargetingDescriptor from '../parsers/TargetingDescriptor.ts'
import type { $ZodType } from 'zod/v4/core'

/**
 * The query has to match the targeting exactly.
 */
export function equalsPredicate<
  QV extends $ZodType,
  TV extends $ZodType,
>(): TargetingPredicate<QV, TV> {
  return (q) => (t) => q === t
}

export function targetEquals<T extends $ZodType>(
  t: T,
): TargetingDescriptor<T, T> {
  return {
    predicate: equalsPredicate(),
    queryParser: t,
    targetingParser: t,
  }
}
