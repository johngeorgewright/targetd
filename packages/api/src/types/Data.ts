import type Data from '../Data.ts'
import type * as FTTT from './FallThroughTargeting.ts'
import type { $ZodShape, output } from 'zod/v4/core'

/**
 * Configuration metadata for a Data instance.
 * Defines the Zod parsers for payloads, targeting, queries, and fallthrough targeting.
 */
export interface Meta {
  PayloadParsers: $ZodShape
  TargetingParsers: $ZodShape
  QueryParsers: $ZodShape
  FallThroughTargetingParsers: $ZodShape
}

/**
 * Empty metadata configuration for Data instances with no parsers defined.
 */
export interface EmptyMeta {
  PayloadParsers: {}
  TargetingParsers: {}
  QueryParsers: {}
  FallThroughTargetingParsers: {}
}

/**
 * Match any Data
 */
export type Any = Data<
  {
    PayloadParsers: Record<string, any>
    TargetingParsers: Record<string, any>
    QueryParsers: Record<string, any>
    FallThroughTargetingParsers: Record<string, any>
  }
>

/**
 * Extract the Meta configuration from a Data type.
 *
 * @template D - Any Data instance type.
 */
export type $<D extends Any> = D extends Data<infer $> ? $ : never

/**
 * Get the PayloadParsers from a Data type
 */
export type PayloadParsers<D extends Any> = $<D>['PayloadParsers']

/**
 * Get the TargetingParsers from a Data type
 */
export type TargetingParsers<D extends Any> = $<D>['TargetingParsers']

/**
 * Get the QueryParsers from a Data type
 */
export type QueryParsers<D extends Any> = $<D>['QueryParsers']

/**
 * Get the FallThroughTargetingParsers from a Data type
 */
export type FallThroughTargetingParsers<D extends Any> = $<
  D
>['FallThroughTargetingParsers']

/**
 * Data shape that can be inserted into a Data instance.
 * Maps payload names to their values or rule sets.
 *
 * @template $ - Data meta configuration.
 */
export type InsertableData<$ extends Meta> = Partial<
  {
    [Name in keyof $['PayloadParsers']]:
      | output<$['PayloadParsers'][Name]>
      | FTTT.Rules<
        $,
        $['PayloadParsers'][Name]
      >
      | FTTT.Rules<
        $ & {
          TargetingParsers: {}
          FallThroughTargetingParsers: $['TargetingParsers']
        },
        $['PayloadParsers'][Name]
      >
  }
>
