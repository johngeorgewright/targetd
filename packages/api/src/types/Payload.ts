import type { $ZodShape, $ZodType, output } from 'zod/v4/core'
import type * as FTTT from './FallThroughTargeting.ts'

export type Payload<P extends $ZodType, T extends $ZodShape> =
  | output<P>
  | FTTT.Rules<P, T>

export type Payloads<
  PayloadParsers extends $ZodShape,
  FallThroughTargetingParsers extends $ZodShape,
> = {
  [Name in keyof PayloadParsers]?: Payload<
    PayloadParsers[Name],
    FallThroughTargetingParsers
  >
}
