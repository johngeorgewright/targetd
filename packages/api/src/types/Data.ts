import type Data from '../Data.ts'
import type * as FTTT from './FallThroughTargeting.ts'
import type { $ZodShape, $ZodType, output } from 'zod/v4/core'

export interface Meta {
  PayloadParsers: $ZodShape
  TargetingParsers: $ZodShape
  QueryParsers: $ZodShape
  FallThroughTargetingParsers: $ZodShape
}

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
    PayloadParsers: any
    TargetingParsers: any
    QueryParsers: any
    FallThroughTargetingParsers: any
  }
>

export type $<D extends Any> = D extends Data<infer $> ? $ : never

/**
 * Get the PayloadParsers from a Data type
 */
export type PayloadParsers<D extends Any> = D extends Data<infer $>
  ? $['PayloadParsers']
  : never

/**
 * Get the TargetingParsers from a Data type
 */
export type TargetingParsers<D extends Any> = D extends Data<infer $>
  ? $['TargetingParsers']
  : never

/**
 * Get the QueryParsers from a Data type
 */
export type QueryParsers<D extends Any> = D extends Data<infer $>
  ? $['QueryParsers']
  : never

/**
 * Get the FallThroughTargetingParsers from a Data type
 */
export type FallThroughTargetingParsers<D extends Any> = D extends Data<infer $>
  ? $['FallThroughTargetingParsers']
  : never

/**
 * Create the fall through Data type from a Data type
 */
export type FallThrough<D extends Any> = Data<{
  PayloadParsers: PayloadParsers<D>
  TargetingParsers: { [K in keyof FallThroughTargetingParsers<D>]: $ZodType }
  QueryParsers: Omit<QueryParsers<D>, keyof TargetingParsers<D>>
  FallThroughTargetingParsers: {}
}>

/**
 * A union of possible payloads for a Data's PayloadParser
 */
export type Payload<D extends Any, Name extends keyof PayloadParsers<D>> =
  | output<PayloadParsers<D>[Name]>
  | FTTT.Rules<PayloadParsers<D>[Name], TargetingParsers<D>>

export type InsertableData<
  D extends $ZodShape,
  TP extends $ZodShape,
  FTP extends $ZodShape,
> = Partial<
  {
    [Name in keyof D]:
      | output<D[Name]>
      | FTTT.Rules<D[Name], TP>
      | FTTT.Rules<D[Name], FTP>
  }
>
