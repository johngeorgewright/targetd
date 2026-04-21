import type { DataSchema } from '../DataSchema.ts'
import type * as FTTT from './FallThroughTargeting.ts'
import type { output } from 'zod/v4/core'

/**
 * Data shape that can be inserted into a Data instance.
 * Maps payload names to their values or rule sets.
 *
 * @template $ - DataSchema type.
 */
export type InsertableData<$ extends DataSchema> = Partial<
  {
    [Name in keyof $['payloadParsers']]:
      | output<$['payloadParsers'][Name]>
      | FTTT.Rules<
        $,
        $['payloadParsers'][Name]
      >
      | FTTT.Rules<
        $ & {
          targetingParsers: {}
          fallThroughTargetingParsers: $['targetingParsers']
        },
        $['payloadParsers'][Name]
      >
  }
>
