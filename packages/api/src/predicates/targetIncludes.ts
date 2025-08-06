import type TargetingDescriptor from '../parsers/TargetingDescriptor.ts'
import type { $ZodType } from 'zod/v4/core'
import { array, type ZodMiniArray } from 'zod/mini'

/**
 * Targeting can contain a singular query value.
 */
export function targetIncludes<T extends $ZodType>(
  t: T,
): TargetingDescriptor<ZodMiniArray<T>, T> {
  return {
    predicate: (q) => (t) => !q || t.includes(q),
    queryParser: t,
    targetingParser: array(t),
  }
}
