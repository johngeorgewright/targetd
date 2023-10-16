import { z } from 'zod'
import TargetingPredicate from '../validators/TargetingPredicate'
import TargetingDescriptor from '../validators/TargetingDescriptor'

/**
 * Targeting can contain a singular query value.
 */
export function targetIncludesPredicate<
  QV extends z.ZodTypeAny,
  TV extends z.ZodTypeAny
>(): TargetingPredicate<QV, TV> {
  return (q) => (t) => t.includes(q)
}

export function targetIncludes<T extends z.ZodTypeAny>(
  t: T
): TargetingDescriptor<z.ZodArray<T>, T> {
  return {
    predicate: targetIncludesPredicate(),
    queryValidator: t,
    targetingValidator: t.array(),
  }
}
