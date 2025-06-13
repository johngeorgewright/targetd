import type { Keys } from 'ts-toolbelt/out/Any/Keys'
import type TargetingPredicate from './TargetingPredicate.ts'
import type {
  $InferObjectOutput,
  $strict,
  $ZodShape,
  $ZodType,
  output,
} from 'zod/v4/core'

type TargetingPredicates<
  Targeting extends $ZodShape,
  Query extends Record<Keys<Targeting>, $ZodType>,
> = {
  [Name in Keys<Targeting>]: {
    predicate: TargetingPredicate<
      Query[Name],
      Targeting[Name],
      Partial<output<$InferObjectOutput<Query, $strict>>>
    >
    requiresQuery: boolean
  }
}

export default TargetingPredicates
