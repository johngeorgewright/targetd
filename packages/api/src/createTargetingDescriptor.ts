import * as z from 'zod'
import TargetingDescriptor from './validators/TargetingDescriptor'

export default function createTargetingDescriptor<
  QV extends z.ZodTypeAny,
  TV extends z.ZodTypeAny
>({
  predicate,
  queryValidator,
  requiresQuery = true,
  targetingValidator,
}: TargetingDescriptor<TV, QV>): TargetingDescriptor<TV, QV> {
  return { predicate, queryValidator, requiresQuery, targetingValidator }
}
