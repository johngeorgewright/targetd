import { type ZodTypeAny } from 'zod'
import type TargetingPredicate from './TargetingPredicate'

export default interface TargetingDescriptor<
  TV extends ZodTypeAny,
  QV extends ZodTypeAny,
  Query extends Record<string, any> = {},
> {
  predicate: TargetingPredicate<QV, TV, Query>
  queryValidator: QV
  requiresQuery?: boolean
  targetingValidator: TV
}

export function isTargetingDescriptor<
  TV extends ZodTypeAny,
  QV extends ZodTypeAny,
>(x: unknown): x is TargetingDescriptor<TV, QV, any> {
  return (
    typeof x === 'object' &&
    x !== null &&
    'predicate' in x &&
    'queryValidator' in x &&
    'targetingValidator' in x
  )
}

export type TargetingDescriptorTargetingValidator<
  TD extends TargetingDescriptor<any, any, any>,
> = TD extends TargetingDescriptor<infer TV, any, any> ? TV : never

export type TargetingDescriptorQueryValidator<
  TD extends TargetingDescriptor<any, any, any>,
> = TD extends TargetingDescriptor<any, infer QV, any> ? QV : never
