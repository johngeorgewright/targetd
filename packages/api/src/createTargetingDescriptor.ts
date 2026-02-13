import type { $ZodType } from 'zod/v4/core'
import type TargetingDescriptor from './parsers/TargetingDescriptor.ts'

/**
 * Create a targeting descriptor with default options.
 * Sets `requiresQuery: true` by default, which can be overridden in the descriptor.
 *
 * @param targetingDescriptor - The targeting descriptor configuration with predicate, parsers, and optional requiresQuery.
 * @returns The targeting descriptor with requiresQuery defaulted to true.
 *
 * @example
 * ```ts
 * import { createTargetingDescriptor } from '@targetd/api'
 * import { z } from 'zod'
 *
 * const customTargeting = createTargetingDescriptor({
 *   predicate: (query) => (target) => query === target,
 *   queryParser: z.string(),
 *   targetingParser: z.string(),
 *   requiresQuery: false // Evaluates even without query parameter
 * })
 * ```
 */
export default function createTargetingDescriptor<
  TV extends $ZodType,
  QV extends $ZodType,
  Query extends Record<string, any> = {},
>(
  targetingDescriptor: TargetingDescriptor<TV, QV, Query>,
): TargetingDescriptor<TV, QV, Query> {
  return { requiresQuery: true, ...targetingDescriptor }
}
