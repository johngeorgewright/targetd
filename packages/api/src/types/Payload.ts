import type { infer as zInfer, ZodTypeAny, ZodRawShape } from 'zod'
import type { FTTT } from './FallThroughTargeting'

/**
 * Payload type utilities
 */
export namespace PT {
  export type Payload<
    P extends ZodTypeAny,
    T extends ZodRawShape,
    Q extends ZodRawShape,
  > = zInfer<P> | FTTT.Rules<P, T, Q>
}
