import type TargetingPredicate from '../validators/TargetingPredicate'
import type TargetingDescriptor from '../validators/TargetingDescriptor'
import { type ZodTypeAny } from 'zod'

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
    queryValidator: t,
    targetingValidator: t,
  }
}
