import type {
  infer as zInfer,
  UnknownKeysParam,
  ZodObject,
  ZodOptional,
  ZodRawShape,
  input,
} from 'zod'

export type StaticRecord<R extends ZodRawShape> = {
  [K in keyof R]: zInfer<R[K]>
}

export type StaticRecordInput<R extends ZodRawShape> = {
  [K in keyof R]: input<R[K]>
}

export type MaybePromise<T> = T | Promise<T>

export type ZodPartialObject<
  T extends ZodRawShape,
  UnknownKeys extends UnknownKeysParam = 'strip',
> = ZodObject<
  {
    [K in keyof T]: ZodOptional<T[K]>
  },
  UnknownKeys
>
