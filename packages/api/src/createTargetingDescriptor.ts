import z from 'zod'
import TargetingDescriptor from './validators/TargetingDescriptor'

export default function createTargetingDescriptor<
  QV extends z.ZodTypeAny,
  TV extends z.ZodTypeAny
>(
  targetingDescriptor: TargetingDescriptor<TV, QV>
): TargetingDescriptor<TV, QV> {
  return { requiresQuery: true, ...targetingDescriptor }
}
