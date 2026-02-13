import type TargetingDescriptor from '../parsers/TargetingDescriptor.ts'
import type { $ZodType } from 'zod/v4/core'

/**
 * Create a targeting descriptor that matches when the query value exactly equals the targeting value.
 *
 * @param t - Zod schema for both query and targeting values.
 * @param options - Configuration options.
 * @param options.withNegate - Enable negation support (e.g., `!value` to exclude).
 * @returns A targeting descriptor with exact equality matching.
 *
 * @example
 * ```ts
 * import { Data, targetEquals } from '@targetd/api'
 * import { z } from 'zod'
 *
 * const data = await Data.create()
 *   .usePayload({ feature: z.string() })
 *   .useTargeting({ isPremium: targetEquals(z.boolean()) })
 *   .addRules('feature', [
 *     { targeting: { isPremium: true }, payload: 'Premium feature' },
 *     { payload: 'Basic feature' }
 *   ])
 *
 * await data.getPayload('feature', { isPremium: true }) // 'Premium feature'
 * ```
 *
 * @example With negation:
 * ```ts
 * .useTargeting({ environment: targetEquals(z.string(), { withNegate: true }) })
 * .addRules('config', [
 *   { targeting: { environment: '!production' }, payload: 'Debug mode' }
 * ])
 * ```
 */
export function targetEquals<T extends $ZodType>(
  t: T,
  options: { withNegate?: boolean } = {},
): TargetingDescriptor<T, T> {
  return {
    predicate: (q) => (t) =>
      !q || q === t || (!!options.withNegate && t !== `!${q}`),
    queryParser: t,
    targetingParser: t,
  }
}
