import type { StaticRecord } from '../types.ts'
import type TargetingDescriptor from '../parsers/TargetingDescriptor.ts'
import type * as TT from './Targeting.ts'
import type { $ZodShape } from 'zod/v4/core'

/**
 * Raw query object with all fields optional.
 *
 * @template QP - Zod shape object for query parsers.
 */
export type Raw<QP extends $ZodShape> = Partial<StaticRecord<QP>>

/**
 * Gets the query parser from a targeting descriptor
 */
export type ParserFromDescriptor<
  TD extends TargetingDescriptor<any, any, any>,
> = TD extends TargetingDescriptor<any, infer QV, any> ? QV : never

/**
 * Maps targeting descriptor names to their query parser types.
 *
 * @template TDs - Record of targeting descriptors.
 */
export type ParserRecord<TDs extends TT.DescriptorRecord> = {
  [K in keyof TDs]: ParserFromDescriptor<TDs[K]>
}
