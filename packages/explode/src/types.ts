import type { DT, PT } from '@targetd/api'
import type { O, S, U } from 'ts-toolbelt'

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
