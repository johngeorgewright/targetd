import type { infer as zInfer, ZodRawShape, ZodTypeAny } from 'zod'
import type * as FTTT from './FallThroughTargeting.ts'

export type Payload<P extends ZodTypeAny, T extends ZodRawShape> =
  | zInfer<P>
  | FTTT.Rules<P, T>
