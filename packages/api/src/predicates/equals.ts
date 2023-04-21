import { z } from 'zod'
import TargetingPredicate from '../validators/TargetingPredicate'

/**
 * The query has to match the targeting exactly.
 */
export function equalsPredicate<
  QV extends z.ZodTypeAny,
  TV extends z.ZodTypeAny
>(): TargetingPredicate<QV, TV> {
  return (q) => (t) => q === t
}
