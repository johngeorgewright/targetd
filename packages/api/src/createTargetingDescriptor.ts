import type { ZodTypeAny } from 'zod'
import type TargetingDescriptor from './validators/TargetingDescriptor'

export default function createTargetingDescriptor<
  QV extends ZodTypeAny,
  TV extends ZodTypeAny,
  Query extends Record<string, any> = {},
>(
  targetingDescriptor: TargetingDescriptor<TV, QV, Query>,
): TargetingDescriptor<TV, QV, Query> {
  return { requiresQuery: true, ...targetingDescriptor }
}
