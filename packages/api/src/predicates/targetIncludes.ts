import type TargetingDescriptor from '../parsers/TargetingDescriptor.ts'
import type { $ZodArray, $ZodType } from 'zod/v4/core'
import { array } from 'zod/mini'

/**
 * Targeting can contain a singular query value.
 */
export function targetIncludes<T extends $ZodType>(
  t: T,
): TargetingDescriptor<$ZodArray<T>, T> {
  return {
    predicate: (q) => (t) => !q || t.includes(q),
    queryParser: t,
    targetingParser: array(t),
  }
}
