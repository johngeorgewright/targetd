import * as rt from 'runtypes'
import TargetingPredicate from './TargetingPredicate'

export default interface TargetingDescriptor<
  Name extends string,
  TV extends rt.Runtype,
  QV extends rt.Runtype
> {
  name: Name
  predicate: TargetingPredicate<QV, TV>
  validator: TV
  queryValidator: QV
}
