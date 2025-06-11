import type { ZodRawShape } from 'zod'
import type { StaticRecord } from '../types.ts'
import type TargetingDescriptor from '../parsers/TargetingDescriptor.ts'
import type * as TT from './Targeting.ts'

export type Raw<QP extends ZodRawShape> = Partial<StaticRecord<QP>>

/**
 * Gets the query parser from a targeting descriptor
 */
export type ParserFromDescriptor<
  TD extends TargetingDescriptor<any, any, any>,
> = TD extends TargetingDescriptor<any, infer QV, any> ? QV : never

export type ParserRecord<TDs extends TT.DescriptorRecord> = {
  [K in keyof TDs]: ParserFromDescriptor<TDs[K]>
}
