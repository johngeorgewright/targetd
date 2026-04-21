import type { Keys } from 'ts-toolbelt/out/Any/Keys'
import type TargetingPredicate from './TargetingPredicate.ts'
import type {
  $InferObjectOutput,
  $strict,
  $ZodShape,
  output,
} from 'zod/v4/core'

/**
 * Maps targeting field names to their predicate functions and requirements.
 * Used internally to configure how each targeting field is evaluated.
 *
 * @template $ - Shape with `targetingParsers` and `queryParsers`.
 */
type TargetingPredicates<
  $ extends {
    targetingParsers: $ZodShape
    queryParsers: $ZodShape
  },
> = {
  [Name in Keys<$['targetingParsers']>]: {
    predicate: TargetingPredicate<
      $['queryParsers'][Name],
      $['targetingParsers'][Name],
      Partial<output<$InferObjectOutput<$['queryParsers'], $strict>>>
    >
    requiresQuery: boolean
  }
}

export default TargetingPredicates
