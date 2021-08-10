import * as rt from 'runtypes'
import { Keys } from 'ts-toolbelt/out/Any/Keys'
import TargetingPredicate from './TargetingPredicate'

type TargetingPredicates<
  Targeting extends Record<string, rt.Runtype>,
  Query extends Record<Keys<Targeting>, rt.Runtype>
> = {
  [Name in Keys<Targeting>]: TargetingPredicate<Query[Name], Targeting[Name]>
}

export default TargetingPredicates
