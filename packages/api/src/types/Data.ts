import type { infer as zInfer, ZodRawShape, ZodTypeAny } from 'zod'
import type Data from '../Data'
import type { FTTT } from './FallThroughTargeting'
import type TargetingDescriptor from '../parsers/TargetingDescriptor'
import type { TT } from './Targeting'
import type { QT } from './Query'

/**
 * Data type utilities
 */
export namespace DT {
  /**
   * Match any Data
   */
  export type Any = Data<any, any, any, any>

  /**
   * Get the DataParsers from a Data type
   */
  export type DataParsers<D extends Any> =
    D extends Data<infer V, any, any, any> ? V : never

  /**
   * Get the TargetingParsers from a Data type
   */
  export type TargetingParsers<D extends Any> =
    D extends Data<ZodRawShape, infer V, ZodRawShape, ZodRawShape> ? V : never

  /**
   * Get the QueryParsers from a Data type
   */
  export type QueryParsers<D extends Any> =
    D extends Data<ZodRawShape, ZodRawShape, infer V, ZodRawShape> ? V : never

  /**
   * Get the FallThroughTargetingParsers from a Data type
   */
  export type FallThroughTargetingParsers<D extends Any> =
    D extends Data<ZodRawShape, ZodRawShape, ZodRawShape, infer V> ? V : never

  /**
   * Create the fall through Data type from a Data type
   */
  export type FallThrough<D extends Any> = Data<
    DataParsers<D>,
    { [K in keyof FallThroughTargetingParsers<D>]: ZodTypeAny },
    Omit<QueryParsers<D>, keyof TargetingParsers<D>>,
    {}
  >

  /**
   * A union of possible payloads for a Data's DataParser
   */
  export type Payload<D extends Any, Name extends keyof DataParsers<D>> =
    | zInfer<DataParsers<D>[Name]>
    | FTTT.Rules<DataParsers<D>[Name], TargetingParsers<D>>

  /**
   * The options for Data.create
   */
  export interface CreateOptions {
    data?: ZodRawShape
    targeting?: Record<string, TargetingDescriptor<any, any, any>>
    fallThroughTargeting?: Record<
      string,
      ZodTypeAny | TargetingDescriptor<any, any, any>
    >
  }

  /**
   * Create a {@link Data} from a {@link CreateOptions} type.
   */
  export type FromCreateOptions<
    T extends CreateOptions,
    R extends Required<CreateOptions> = Required<{
      [K in keyof T]: Exclude<T[K], undefined>
    }>,
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
    D extends ZodRawShape,
    TP extends ZodRawShape,
    FTP extends ZodRawShape,
  > = Partial<{
    [Name in keyof D]:
      | zInfer<D[Name]>
      | FTTT.Rules<D[Name], TP>
      | FTTT.Rules<D[Name], FTP>
  }>
}
