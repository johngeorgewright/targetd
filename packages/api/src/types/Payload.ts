import type { $ZodType, output } from 'zod/v4/core'
import type * as FTTT from './FallThroughTargeting.ts'
import type { DataSchema } from '../DataSchema.ts'

/**
 * A payload value that can be either a direct value or a set of fallthrough rules.
 *
 * @template $ - DataSchema type.
 * @template PayloadParser - Zod parser for the payload type.
 */
export type Payload<
  $ extends DataSchema,
  PayloadParser extends $ZodType,
> =
  | output<PayloadParser>
  | FTTT.Rules<$, PayloadParser>

/**
 * Maps payload names to their Payload values.
 * Used to represent all payloads in a Data instance.
 *
 * @template $ - DataSchema type.
 */
export type Payloads<$ extends DataSchema> = {
  [Name in keyof $['payloadParsers']]?: Payload<$, $['payloadParsers'][Name]>
}
