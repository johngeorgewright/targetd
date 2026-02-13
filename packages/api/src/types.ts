import type {
  $InferObjectOutput,
  $strip,
  $ZodObjectConfig,
  $ZodOptional,
  $ZodShape,
} from 'zod/v4/core'
import type { ZodMiniObject, ZodMiniOptional } from 'zod/mini'

/**
 * Infer static type from a Zod shape object.
 * Converts Zod parsers to their output TypeScript types.
 *
 * @example
 * ```ts
 * const shape = { name: z.string(), age: z.number() }
 * type User = StaticRecord<typeof shape>
 * // Result: { name: string, age: number }
 * ```
 */
export type StaticRecord<
  R extends $ZodShape,
  Config extends $ZodObjectConfig = $strip,
> = $InferObjectOutput<R, Config>

/**
 * Type that can be either a value or a Promise resolving to that value.
 *
 * @internal
 */
export type MaybePromise<T> = T | Promise<T>

/**
 * Zod object type with all properties optional.
 *
 * @internal
 */
export type ZodPartialObject<
  T extends $ZodShape,
  Config extends $ZodObjectConfig = $strip,
> = ZodMiniObject<
  {
    [K in keyof T]: ZodMiniOptional<T[K]>
  },
  Config
>

/**
 * Infer type from a Zod partial object (all properties optional).
 *
 * @internal
 */
export type ZodPartialInferObject<Shape extends $ZodShape> = $InferObjectOutput<
  { [K in keyof Shape]: $ZodOptional<Shape[K]> },
  {}
>

/**
 * Type that can be either a single value or an array of values.
 *
 * @internal
 */
export type MaybeArray<T> = T | T[]

/**
 * Extract all possible value types from an object type.
 *
 * @internal
 */
export type ObjValues<T> = T[keyof T]
