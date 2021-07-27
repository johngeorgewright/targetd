import { Runtype } from 'runtypes'
import TargetingPredicate from './TargetingPredicate'

export default interface TargetingDescriptor {
  name: string
  predicate: TargetingPredicate
  runtype: Runtype
}
