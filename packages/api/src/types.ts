import type {
  $InferObjectOutput,
  $strip,
  $ZodObjectConfig,
  $ZodOptional,
  $ZodShape,
} from 'zod/v4/core'
import type { ZodMiniObject, ZodMiniOptional } from 'zod/mini'

export type StaticRecord<
  R extends $ZodShape,
  Config extends $ZodObjectConfig = $strip,
> = $InferObjectOutput<R, Config>

export type MaybePromise<T> = T | Promise<T>

export type ZodPartialObject<
  T extends $ZodShape,
  Config extends $ZodObjectConfig = $strip,
> = ZodMiniObject<
  {
    [K in keyof T]: ZodMiniOptional<T[K]>
  },
  Config
>

export type ZodPartialInferObject<Shape extends $ZodShape> = $InferObjectOutput<
  { [K in keyof Shape]: $ZodOptional<Shape[K]> },
  {}
>

export type MaybeArray<T> = T | T[]
