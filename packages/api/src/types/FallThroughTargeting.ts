import type { infer as zInfer, ZodRawShape, ZodTypeAny } from 'zod'
import type TargetingDescriptor from '../parsers/TargetingDescriptor.ts'
import type * as TT from './Targeting.ts'
import type { RuleWithPayloadParser } from '../parsers/DataItemRule.ts'

/**
 * Matches any fallthrough targeting descriptor record
 */
export type DescriptorRecord = Record<
  string,
  ZodTypeAny | TargetingDescriptor<any, any, any>
>

/**
 * Gets the fallthrough parser from a targeting descriptor
 */
export type ParserFromDescriptor<
  T extends ZodTypeAny | TargetingDescriptor<any, any, any>,
> = T extends TargetingDescriptor<any, any, any> ? TT.ParserFromDescriptor<T>
  : T

/**
 * Turns a record of targeting descriptors in to a record of fallthrough parsers
 */
export type ParsersRecord<TDs extends DescriptorRecord> = {
  [K in keyof TDs]: ParserFromDescriptor<TDs[K]>
}

/**
 * The data shape of a set of fallthrough rules
 */
export type Rules<P extends ZodTypeAny, T extends ZodRawShape> = {
  __rules__: zInfer<RuleWithPayloadParser<P, T>>[]
}
