import { z } from 'zod'
import TargetingPredicate from '../validators/TargetingPredicate'
import TargetingDescriptor from '../validators/TargetingDescriptor'

/**
 * The query has to match the targeting exactly.
 */
export function equalsPredicate<
  QV extends z.ZodTypeAny,
  TV extends z.ZodTypeAny
>(): TargetingPredicate<QV, TV> {
  return (q) => (t) => q === t
}

export function targetEquals<T extends z.ZodTypeAny>(
  t: T
): TargetingDescriptor<T, T> {
  return {
    predicate: equalsPredicate(),
    queryValidator: t,
    targetingValidator: t,
  }
}
