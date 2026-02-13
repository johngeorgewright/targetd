import type TargetingDescriptor from '../parsers/TargetingDescriptor.ts'
import type { $ZodArray, $ZodType, output } from 'zod/v4/core'
import { array } from 'zod/mini'

/**
 * Create a targeting descriptor that matches when a targeting array includes the query value.
 * The query is a single value, while targeting is an array that may contain that value.
 *
 * @param t - Zod schema for the query value (targeting will be an array of this type).
 * @param options - Configuration options.
 * @param options.withNegate - Enable negation support (e.g., `!value` to exclude).
 * @returns A targeting descriptor with array inclusion matching.
 *
 * @example
 * ```ts
 * import { Data, targetIncludes } from '@targetd/api'
 * import { z } from 'zod'
 *
 * const data = await Data.create()
 *   .usePayload({ content: z.string() })
 *   .useTargeting({ country: targetIncludes(z.string()) })
 *   .addRules('content', [
 *     { targeting: { country: ['US', 'CA'] }, payload: 'North America content' },
 *     { targeting: { country: ['UK', 'FR'] }, payload: 'Europe content' },
 *     { payload: 'Default content' }
 *   ])
 *
 * await data.getPayload('content', { country: 'US' }) // 'North America content'
 * await data.getPayload('content', { country: 'UK' }) // 'Europe content'
 * ```
 *
 * @example With negation:
 * ```ts
 * .useTargeting({ platform: targetIncludes(z.string(), { withNegate: true }) })
 * .addRules('content', [
 *   { targeting: { platform: ['!mobile'] }, payload: 'Desktop-only content' }
 * ])
 * ```
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
