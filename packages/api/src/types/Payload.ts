import type { $ZodType, output } from 'zod/v4/core'
import type * as FTTT from './FallThroughTargeting.ts'
import type * as DT from './Data.ts'

export type Payload<
  $ extends Pick<DT.Meta, 'FallThroughTargetingParsers'>,
  PayloadParser extends $ZodType,
> =
  | output<PayloadParser>
  | FTTT.Rules<$, PayloadParser>

export type Payloads<
  $ extends Pick<DT.Meta, 'PayloadParsers' | 'FallThroughTargetingParsers'>,
> = {
  [Name in keyof $['PayloadParsers']]?: Payload<$, $['PayloadParsers'][Name]>
}
