import z from 'zod'
import { Keys } from 'ts-toolbelt/out/Any/Keys'
import TargetingPredicate from './TargetingPredicate'

type TargetingPredicates<
  Targeting extends z.ZodRawShape,
  Query extends Record<Keys<Targeting>, z.ZodTypeAny>
> = {
  [Name in Keys<Targeting>]: {
    predicate: TargetingPredicate<Query[Name], Targeting[Name]>
    requiresQuery: boolean
  }
}

export default TargetingPredicates
