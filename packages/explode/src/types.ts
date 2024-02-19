import { O, S, U } from 'ts-toolbelt'
import { RecordKey } from './util'

export type Explode<Rec, Sep extends string> =
  Rec extends Record<string, unknown> ? $Explode<Rec, Sep> : Rec

type $Explode<
  Rec extends Record<string, unknown>,
  Sep extends string,
> = U.Merge<
  {
    [Key in RecordKey<Rec>]: O.P.Record<S.Split<Key, Sep>, Rec[Key]>
  }[RecordKey<Rec>]
>
