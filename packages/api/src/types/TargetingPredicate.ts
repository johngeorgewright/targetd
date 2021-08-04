import { Runtype, Static } from 'runtypes'
import Query from './Query'

type TargetingPredicate<
  Name extends string | number | symbol,
  T extends Runtype
> = (query: Query) => (targeting: Record<Name, Static<T>>) => boolean

export default TargetingPredicate
