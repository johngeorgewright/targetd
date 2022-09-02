import { Runtype, Static } from 'runtypes'
import { MaybePromise } from '../types'

type TargetingPredicate<QV extends Runtype, TV extends Runtype> = (
  query?: Static<QV>
) => MaybePromise<(targeting: Static<TV>) => MaybePromise<boolean>>

export default TargetingPredicate
