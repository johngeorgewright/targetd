import { z } from 'zod'
import TargetingPredicate from '../validators/TargetingPredicate'

/**
 * Targeting can contain a singular query value.
 */
export function targetIncludesPredicate<
  QV extends z.ZodTypeAny,
  TV extends z.ZodTypeAny
>(): TargetingPredicate<QV, TV> {
  return (q) => (t) => t.includes(q)
}
