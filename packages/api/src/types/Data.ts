import type Data from '../Data.ts'
import type * as FTTT from './FallThroughTargeting.ts'
import type TargetingDescriptor from '../parsers/TargetingDescriptor.ts'
import type * as TT from './Targeting.ts'
import type * as QT from './Query.ts'
import type { $ZodShape, $ZodType, output } from 'zod/v4/core'

/**
 * Match any Data
 */
export type Any = Data<any, any, any, any>

/**
 * Get the PayloadParsers from a Data type
 */
export type PayloadParsers<D extends Any> = D extends
  Data<infer V, any, any, any> ? V : never

/**
 * Get the TargetingParsers from a Data type
 */
export type TargetingParsers<D extends Any> = D extends
  Data<any, infer V, any, any> ? V : never

/**
 * Get the QueryParsers from a Data type
 */
export type QueryParsers<D extends Any> = D extends Data<any, any, infer V, any>
  ? V
  : never

/**
 * Get the FallThroughTargetingParsers from a Data type
 */
export type FallThroughTargetingParsers<D extends Any> = D extends
  Data<any, any, any, infer V> ? V : never

/**
 * Create the fall through Data type from a Data type
 */
export type FallThrough<D extends Any> = Data<
  PayloadParsers<D>,
  { [K in keyof FallThroughTargetingParsers<D>]: $ZodType },
  Omit<QueryParsers<D>, keyof TargetingParsers<D>>,
  {}
>

/**
 * A union of possible payloads for a Data's PayloadParser
 */
export type Payload<D extends Any, Name extends keyof PayloadParsers<D>> =
  | output<PayloadParsers<D>[Name]>
  | FTTT.Rules<PayloadParsers<D>[Name], TargetingParsers<D>>

/**
 * The options for Data.create
 */
export interface CreateOptions {
  data?: $ZodShape
  targeting?: Record<string, TargetingDescriptor<any, any, any>>
  fallThroughTargeting?: Record<
    string,
    $ZodType | TargetingDescriptor<any, any, any>
  >
}

/**
 * Create a {@link Data} from a {@link CreateOptions} type.
 */
export type FromCreateOptions<
  T extends CreateOptions,
  R extends Required<CreateOptions> = Required<
    {
      [K in keyof T]: Exclude<T[K], undefined>
    }
  >,
> = Data<
  R['data'],
  {
    [K in keyof R['targeting']]: TT.ParserFromDescriptor<R['targeting'][K]>
  },
  {
    [K in keyof R['targeting']]: QT.ParserFromDescriptor<R['targeting'][K]>
  },
  {
    [K in keyof R['fallThroughTargeting']]: FTTT.ParserFromDescriptor<
      R['fallThroughTargeting'][K]
    >
  }
>

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
