import type TargetingDescriptor from '../parsers/TargetingDescriptor.ts'
import type { $ZodArray, $ZodType, output } from 'zod/v4/core'
import { array } from 'zod/mini'

/**
 * Targeting can contain a singular query value.
 */
export function targetIncludes<T extends $ZodType>(
  t: T,
  options: { withNegate?: boolean } = {},
): TargetingDescriptor<$ZodArray<T>, T> {
  return {
    predicate: (q) => (t) =>
      !q || t.includes(q) || (!!options.withNegate && checkNegate(q, t)),
    queryParser: t,
    targetingParser: array(t),
  }
}

function checkNegate<T extends $ZodType>(q: output<T>, ts: output<T>[]) {
  return ts.every((t) => t !== `!${q}`)
}
