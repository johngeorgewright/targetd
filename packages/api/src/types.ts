import * as rt from 'runtypes'

export type StaticRecord<R extends Record<string, rt.Runtype>> = {
  [K in keyof R]: rt.Static<R[K]>
}

export type MaybePromise<T> = T | Promise<T>
