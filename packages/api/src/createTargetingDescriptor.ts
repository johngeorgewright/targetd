import type { $ZodType } from 'zod/v4/core'
import type TargetingDescriptor from './parsers/TargetingDescriptor.ts'
import type { TargetingDescriptorInput } from './parsers/TargetingDescriptor.ts'
import { unknown, type ZodMiniUnknown } from 'zod/mini'

export default function createTargetingDescriptor<
  TV extends $ZodType,
  QV extends $ZodType = ZodMiniUnknown,
  Query extends Record<string, any> = {},
>(
  targetingDescriptor: TargetingDescriptorInput<TV, QV, Query>,
): TargetingDescriptor<TV, QV, Query> {
  return {
    requiresQuery: true,
    queryParser: (targetingDescriptor.queryParser ?? unknown()) as QV,
    ...targetingDescriptor,
  }
}
