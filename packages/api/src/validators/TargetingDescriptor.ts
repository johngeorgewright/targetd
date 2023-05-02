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

export function isTargetingDescriptor<
  TV extends z.ZodTypeAny,
  QV extends z.ZodTypeAny
>(x: unknown): x is TargetingDescriptor<TV, QV> {
  return (
    typeof x === 'object' &&
    x !== null &&
    'predicate' in x &&
    'queryValidator' in x &&
    'targetingValidator' in x
  )
}
