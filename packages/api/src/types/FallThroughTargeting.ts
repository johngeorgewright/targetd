import type TargetingDescriptor from '../parsers/TargetingDescriptor.ts'
import type * as TT from './Targeting.ts'
import type { RuleWithPayload } from '../parsers/DataItemRule.ts'
import type { $ZodType } from 'zod/v4/core'
import type { DataItemRulesOut } from '../parsers/DataItemRules.ts'
import type * as DT from './Data.ts'
import type { ZodMiniAny } from 'zod/mini'

/**
 * Matches any fallthrough targeting descriptor record
 */
export type DescriptorRecord = Record<
  string,
  $ZodType | TargetingDescriptor<any, any, any>
>

/**
 * Extracts the fallthrough parser from a targeting descriptor.
 * Falls back to the descriptor itself if it's already a parser.
 *
 * @template T - Targeting descriptor or parser.
 */
export type ParserFromDescriptor<
  T extends $ZodType | TargetingDescriptor<any, any, any>,
> = T extends TargetingDescriptor<any, any, any> ? TT.ParserFromDescriptor<T>
  : T

/**
 * Maps targeting descriptor names to their fallthrough parser types.
 *
 * @template TDs - Record of targeting descriptors.
 */
export type ParsersRecord<TDs extends DescriptorRecord> = {
  [K in keyof TDs]: ParserFromDescriptor<TDs[K]>
}

/**
 * Represents a set of fallthrough targeting rules with optional variables.
 * Used when a payload depends on additional targeting conditions.
 *
 * @template $ - Data meta configuration.
 * @template PayloadParser - Zod parser for the payload type.
 */
export type Rules<
  $ extends DT.Meta,
  PayloadParser extends $ZodType,
> = {
  __rules__: RuleWithPayload<PayloadParser, $['FallThroughTargetingParsers']>[]
  __variables__?: Record<
    string,
    DataItemRulesOut<
      $ & { TargetingParsers: $['FallThroughTargetingParsers'] },
      ZodMiniAny
    >
  >
}
