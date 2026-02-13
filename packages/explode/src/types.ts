import type { DT, PT } from '@targetd/api'
import type { O, S, U } from 'ts-toolbelt'

/**
 * Type utility that transforms flat payload keys into nested object structure.
 * Used with the explode function to get properly typed nested payloads.
 *
 * @example
 * ```ts
 * import type { Data } from '@targetd/api'
 * import type { ExplodedPayloads } from '@targetd/explode'
 *
 * type MyData = Data<...>
 * type NestedPayloads = ExplodedPayloads<MyData, '.'>
 * // 'user.name' becomes { user: { name: ... } }
 * ```
 */
export type ExplodedPayloads<
  D extends DT.Any,
  PathSeparator extends string,
> = Explode<
  Partial<
    {
      [Name in keyof DT.PayloadParsers<D>]:
        | PT.Payload<DT.PayloadParsers<D>[Name], DT.TargetingParsers<D>>
        | undefined
    }
  >,
  PathSeparator
>

/**
 * Type utility that recursively transforms flat keys into nested object structure.
 *
 * @example
 * ```ts
 * type Flat = { 'user.name': string, 'user.age': number }
 * type Nested = Explode<Flat, '.'>
 * // Result: { user: { name: string, age: number } }
 * ```
 */
export type Explode<Rec, Sep extends string> = Rec extends
  Record<string, unknown> ? $Explode<Rec, Sep> : Rec

type $Explode<
  Rec extends Record<string, unknown>,
  Sep extends string,
> = U.Merge<
  {
    [Key in RecordKey<Rec>]: O.P.Record<S.Split<Key, Sep>, Rec[Key]>
  }[RecordKey<Rec>]
>

type RecordKey<R extends Record<keyof any, any>> = R extends
  Record<infer V, any> ? V : never
