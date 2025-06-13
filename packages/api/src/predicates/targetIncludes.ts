import type TargetingPredicate from '../parsers/TargetingPredicate.ts'
import type TargetingDescriptor from '../parsers/TargetingDescriptor.ts'
import type { $ZodType, output } from 'zod/v4/core'
import { array, type ZodMiniArray } from 'zod/v4-mini'

/**
 * Targeting can contain a singular query value.
 */
export function targetIncludesPredicate<
  QV extends $ZodType,
  TV extends $ZodType,
>(): TargetingPredicate<QV, ZodMiniArray<TV>> {
  return (q) => (t) => !q || t.includes(q as output<TV>)
}

export function targetIncludes<T extends $ZodType>(
  t: T,
): TargetingDescriptor<ZodMiniArray<T>, T> {
  return {
    predicate: targetIncludesPredicate(),
    queryParser: t,
    targetingParser: array(t),
  }
}
