import type { $ZodShape } from 'zod/v4/core'
import type * as DT from './types/Data.ts'
import type * as FTTT from './types/FallThroughTargeting.ts'
import type * as QT from './types/Query.ts'
import type * as TT from './types/Targeting.ts'
import type { Merge } from './util.ts'

/**
 * Interface for configuring a {@link Data} instance with payload schemas,
 * targeting descriptors, and fall-through targeting.
 *
 * @template $ - The metadata type extending {@link DT.Meta}
 *
 * @example
 * ```ts
 * import { Data, targetIncludes } from '@targetd/api'
 * import { z } from 'zod'
 *
 * const data = await Data.create()
 *   .usePayload({ greeting: z.string() })
 *   .useTargeting({ country: targetIncludes(z.string()) })
 * ```
 */
export interface ConfigurableData<$ extends DT.Meta> {
  /**
   * Register additional payload parsers for validating payloads.
   *
   * @param parsers - An object of Zod schemas keyed by payload name.
   * @returns A new instance with the updated payload parsers.
   */
  usePayload<Parsers extends $ZodShape>(
    parsers: Parsers,
  ): Promise<
    ConfigurableData<
      Merge<$, { PayloadParsers: Merge<$['PayloadParsers'], Parsers> }>
    >
  >

  /**
   * Register targeting descriptors to enable query-based filtering.
   *
   * @param targeting - An object of targeting descriptors keyed by targeting name.
   * @returns A new instance with the updated targeting and query parsers.
   */
  useTargeting<TDs extends TT.DescriptorRecord>(targeting: TDs): Promise<
    ConfigurableData<
      Merge<$, {
        TargetingParsers: Merge<$['TargetingParsers'], TT.ParserRecord<TDs>>
        QueryParsers: Merge<$['QueryParsers'], QT.ParserRecord<TDs>>
      }>
    >
  >

  /**
   * Register fall-through targeting descriptors.
   * Fall-through targeting allows rules to continue matching after a successful match.
   *
   * @param targeting - An object of fall-through targeting descriptors.
   * @returns A new instance with the updated fall-through targeting parsers.
   */
  useFallThroughTargeting<TDs extends FTTT.DescriptorRecord>(
    targeting: TDs,
  ): Promise<
    ConfigurableData<
      Merge<$, {
        FallThroughTargetingParsers: Merge<
          $['FallThroughTargetingParsers'],
          FTTT.ParsersRecord<TDs>
        >
      }>
    >
  >
}
