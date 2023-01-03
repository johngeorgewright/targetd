import z from 'zod'
import { MaybePromise } from '../types'

type TargetingPredicate<QV extends z.ZodTypeAny, TV extends z.ZodTypeAny> = (
  query?: z.infer<QV>
) => MaybePromise<(targeting: z.infer<TV>) => MaybePromise<boolean>>

export default TargetingPredicate
