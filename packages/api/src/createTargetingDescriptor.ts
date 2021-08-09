import * as rt from 'runtypes'
import TargetingPredicate from './validators/TargetingPredicate'

export default function createTargetingDescriptor<
  Name extends string,
  QV extends rt.Runtype,
  TV extends rt.Runtype
>(name: Name, runtype: TV, predicate: TargetingPredicate<Name, QV, TV>) {
  return { name, predicate, runtype }
}
