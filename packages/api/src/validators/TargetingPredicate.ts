import { Runtype, Static } from 'runtypes'

type TargetingPredicate<
  Name extends string,
  QV extends Runtype,
  TV extends Runtype
> = (
  query: Record<Name, Static<QV>>
) => (targeting: Record<Name, Static<TV>>) => boolean

export default TargetingPredicate
