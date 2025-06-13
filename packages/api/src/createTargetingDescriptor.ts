import type { $ZodType } from 'zod/v4/core'
import type TargetingDescriptor from './parsers/TargetingDescriptor.ts'

export default function createTargetingDescriptor<
  TV extends $ZodType,
  QV extends $ZodType,
  Query extends Record<string, any> = {},
>(
  targetingDescriptor: TargetingDescriptor<TV, QV, Query>,
): TargetingDescriptor<TV, QV, Query> {
  return { requiresQuery: true, ...targetingDescriptor }
}
