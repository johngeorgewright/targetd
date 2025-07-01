import type TargetingDescriptor from '../parsers/TargetingDescriptor.ts'
import type { $ZodType } from 'zod/v4/core'

/**
 * The query has to match the targeting exactly.
 */
export function targetEquals<T extends $ZodType>(
  t: T,
): TargetingDescriptor<T, T> {
  return {
    predicate: (q) => (t) => !q || q === t,
    queryParser: t,
    targetingParser: t,
  }
}
