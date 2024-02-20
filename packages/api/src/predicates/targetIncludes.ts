import type TargetingPredicate from '../validators/TargetingPredicate'
import type TargetingDescriptor from '../validators/TargetingDescriptor'
import { type ZodArray, type ZodTypeAny } from 'zod'

/**
 * Targeting can contain a singular query value.
 */
export function targetIncludesPredicate<
  QV extends ZodTypeAny,
  TV extends ZodTypeAny,
>(): TargetingPredicate<QV, ZodArray<TV>> {
  return (q) => (t) => t.includes(q)
}

export function targetIncludes<T extends ZodTypeAny>(
  t: T,
): TargetingDescriptor<ZodArray<T>, T> {
  return {
    predicate: targetIncludesPredicate(),
    queryValidator: t,
    targetingValidator: t.array(),
  }
}
