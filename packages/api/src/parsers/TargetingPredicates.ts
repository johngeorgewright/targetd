import type { Keys } from 'ts-toolbelt/out/Any/Keys'
import type TargetingPredicate from './TargetingPredicate.ts'
import type { infer as zInfer, ZodObject, ZodRawShape, ZodTypeAny } from 'zod'

type TargetingPredicates<
  Targeting extends ZodRawShape,
  Query extends Record<Keys<Targeting>, ZodTypeAny>,
> = {
  [Name in Keys<Targeting>]: {
    predicate: TargetingPredicate<
      Query[Name],
      Targeting[Name],
      Partial<zInfer<ZodObject<Query, 'strict'>>>
    >
    requiresQuery: boolean
  }
}

export default TargetingPredicates
