import type { ZodTypeAny } from 'zod'
import type TargetingDescriptor from './parsers/TargetingDescriptor.ts'

export default function createTargetingDescriptor<
  TV extends ZodTypeAny,
  QV extends ZodTypeAny,
  Query extends Record<string, any> = {},
>(
  targetingDescriptor: TargetingDescriptor<TV, QV, Query>,
): TargetingDescriptor<TV, QV, Query> {
  return { requiresQuery: true, ...targetingDescriptor }
}
