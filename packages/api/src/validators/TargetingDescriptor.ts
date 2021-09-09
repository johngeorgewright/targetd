import * as rt from 'runtypes'
import TargetingPredicate from './TargetingPredicate'

export default interface TargetingDescriptor<
  TV extends rt.Runtype,
  QV extends rt.Runtype
> {
  predicate: TargetingPredicate<QV, TV>
  queryValidator: QV
  requiresQuery?: boolean
  targetingValidator: TV
}
