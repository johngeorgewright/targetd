import { Runtype, Static } from 'runtypes'
import TargetingPredicate from './types/TargetingPredicate'

export default function createTargetingDescriptor<
  Name extends string,
  R extends Runtype
>(
  name: Name,
  runtype: R,
  predicate: TargetingPredicate<Record<Name, Static<R>>>
) {
  return { name, predicate, runtype }
}
