import type TargetingPredicate from '../parsers/TargetingPredicate.ts'
import type TargetingDescriptor from '../parsers/TargetingDescriptor.ts'
import type { ZodTypeAny } from 'zod'

/**
 * The query has to match the targeting exactly.
 */
export function equalsPredicate<
  QV extends ZodTypeAny,
  TV extends ZodTypeAny,
>(): TargetingPredicate<QV, TV> {
  return (q) => (t) => q === t
}

export function targetEquals<T extends ZodTypeAny>(
  t: T,
): TargetingDescriptor<T, T> {
  return {
    predicate: equalsPredicate(),
    queryParser: t,
    targetingParser: t,
  }
}
