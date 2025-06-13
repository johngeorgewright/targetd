import type {
  $InferObjectOutput,
  $strip,
  $ZodObjectConfig,
  $ZodOptional,
  $ZodShape,
} from 'zod/v4/core'
import type { ZodMiniObject } from 'zod/v4-mini'

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
    [K in keyof T]: $ZodOptional<T[K]>
  },
  Config
>
