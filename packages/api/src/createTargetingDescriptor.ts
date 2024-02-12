import z from 'zod'
import TargetingDescriptor from './validators/TargetingDescriptor'

export default function createTargetingDescriptor<
  QV extends z.ZodTypeAny,
  TV extends z.ZodTypeAny,
  Query extends Record<string, any> = {},
>(
  targetingDescriptor: TargetingDescriptor<TV, QV, Query>,
): TargetingDescriptor<TV, QV, Query> {
  return { requiresQuery: true, ...targetingDescriptor }
}
