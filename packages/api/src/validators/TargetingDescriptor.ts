import z from 'zod'
import TargetingPredicate from './TargetingPredicate'

export default interface TargetingDescriptor<
  TV extends z.ZodTypeAny,
  QV extends z.ZodTypeAny
> {
  predicate: TargetingPredicate<QV, TV>
  queryValidator: QV
  requiresQuery?: boolean
  targetingValidator: TV
}
