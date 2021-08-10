import { Runtype, Static } from 'runtypes'

type TargetingPredicate<QV extends Runtype, TV extends Runtype> = (
  query?: Static<QV>
) => (targeting: Static<TV>) => boolean

export default TargetingPredicate
