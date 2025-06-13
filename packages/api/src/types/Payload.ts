import type { $ZodShape, $ZodType, output } from 'zod/v4/core'
import type * as FTTT from './FallThroughTargeting.ts'

export type Payload<P extends $ZodType, T extends $ZodShape> =
  | output<P>
  | FTTT.Rules<P, T>
