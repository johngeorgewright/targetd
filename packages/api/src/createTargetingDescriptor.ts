import * as rt from 'runtypes'
import TargetingDescriptor from './validators/TargetingDescriptor'

export default function createTargetingDescriptor<
  QV extends rt.Runtype,
  TV extends rt.Runtype
>({
  predicate,
  queryValidator,
  requiresQuery = true,
  targetingValidator,
}: TargetingDescriptor<TV, QV>): TargetingDescriptor<TV, QV> {
  return { predicate, queryValidator, requiresQuery, targetingValidator }
}
