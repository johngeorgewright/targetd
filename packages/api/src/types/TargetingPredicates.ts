import { Record } from 'runtypes'
import TargetingPredicate from './TargetingPredicate'

type TargetingPredicates<Targeting extends Record<any, any>> = {
  [Name in keyof Targeting]: TargetingPredicate<Name, Targeting['fields'][Name]>
}

export default TargetingPredicates
