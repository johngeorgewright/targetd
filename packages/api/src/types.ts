import z from 'zod'

export type StaticRecord<R extends z.ZodRawShape> = {
  [K in keyof R]: z.infer<R[K]>
}

export type MaybePromise<T> = T | Promise<T>

export type ZodPartialObject<T extends z.ZodRawShape> = z.ZodObject<{
  [K in keyof T]: z.ZodOptional<T[K]>
}>
