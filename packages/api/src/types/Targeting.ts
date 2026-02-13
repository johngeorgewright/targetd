import type TargetingDescriptor from '../parsers/TargetingDescriptor.ts'

/**
 * Matches a record of targeting descriptors
 */
export type DescriptorRecord = Record<
  string,
  TargetingDescriptor<any, any, any>
>

/**
 * Maps targeting descriptor names to their targeting parser types.
 *
 * @template TDs - Record of targeting descriptors.
 */
export type ParserRecord<TDs extends DescriptorRecord> = {
  [K in keyof TDs]: ParserFromDescriptor<TDs[K]>
}

/**
 * Extracts the targeting parser from a targeting descriptor.
 *
 * @template TD - Targeting descriptor.
 */
export type ParserFromDescriptor<
  TD extends TargetingDescriptor<any, any, any>,
> = TD extends TargetingDescriptor<infer TV, any, any> ? TV : never
