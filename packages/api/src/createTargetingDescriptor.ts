import * as rt from 'runtypes'
import TargetingPredicate from './types/TargetingPredicate'

export default function createTargetingDescriptor<
  Name extends string,
  R extends rt.Runtype
>(name: Name, runtype: R, predicate: TargetingPredicate<Name, R>) {
  return { name, predicate, runtype }
}
