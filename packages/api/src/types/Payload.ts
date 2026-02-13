import type { $ZodType, output } from 'zod/v4/core'
import type * as FTTT from './FallThroughTargeting.ts'
import type * as DT from './Data.ts'

/**
 * A payload value that can be either a direct value or a set of fallthrough rules.
 *
 * @template $ - Data meta configuration.
 * @template PayloadParser - Zod parser for the payload type.
 */
export type Payload<
  $ extends DT.Meta,
  PayloadParser extends $ZodType,
> =
  | output<PayloadParser>
  | FTTT.Rules<$, PayloadParser>

/**
 * Maps payload names to their Payload values.
 * Used to represent all payloads in a Data instance.
 *
 * @template $ - Data meta configuration.
 */
export type Payloads<$ extends DT.Meta> = {
  [Name in keyof $['PayloadParsers']]?: Payload<$, $['PayloadParsers'][Name]>
}
