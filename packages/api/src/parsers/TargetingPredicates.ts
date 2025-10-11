import type { Keys } from 'ts-toolbelt/out/Any/Keys'
import type TargetingPredicate from './TargetingPredicate.ts'
import type * as DT from '../types/Data.ts'
import type { $InferObjectOutput, $strict, output } from 'zod/v4/core'

type TargetingPredicates<
  $ extends Pick<DT.Meta, 'TargetingParsers' | 'QueryParsers'>,
> = {
  [Name in Keys<$['TargetingParsers']>]: {
    predicate: TargetingPredicate<
      $['QueryParsers'][Name],
      $['TargetingParsers'][Name],
      Partial<output<$InferObjectOutput<$['QueryParsers'], $strict>>>
    >
    requiresQuery: boolean
  }
}

export default TargetingPredicates
