import { Runtype } from 'runtypes'
import TargetingPredicate from './TargetingPredicate'

export default interface TargetingDescriptor<
  Name extends string,
  R extends Runtype
> {
  name: Name
  predicate: TargetingPredicate<Name, R>
  runtype: R
}
