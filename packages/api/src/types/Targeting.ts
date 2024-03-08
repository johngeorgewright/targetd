import type TargetingDescriptor from '../parsers/TargetingDescriptor'

/**
 * Targeting type utilities
 */
export namespace TT {
  /**
   * Matches a record of targeting descriptors
   */
  export type DescriptorRecord = Record<
    string,
    TargetingDescriptor<any, any, any>
  >

  /**
   * Turns a record of targeting descriptors in to a record of targeting parsers
   */
  export type ParserRecord<TDs extends DescriptorRecord> = {
    [K in keyof TDs]: ParserFromDescriptor<TDs[K]>
  }

  export type ParserFromDescriptor<
    TD extends TargetingDescriptor<any, any, any>,
  > = TD extends TargetingDescriptor<infer TV, any, any> ? TV : never
}
