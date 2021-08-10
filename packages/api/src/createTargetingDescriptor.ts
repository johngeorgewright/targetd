import * as rt from 'runtypes'
import TargetingDescriptor from './validators/TargetingDescriptor'
import TargetingPredicate from './validators/TargetingPredicate'

export default function createTargetingDescriptor<
  Name extends string,
  QV extends rt.Runtype,
  TV extends rt.Runtype
>(
  name: Name,
  queryValidator: QV,
  validator: TV,
  predicate: TargetingPredicate<QV, TV>
): TargetingDescriptor<Name, TV, QV> {
  return { name, predicate, queryValidator, validator }
}
