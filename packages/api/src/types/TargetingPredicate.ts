import ConfigItemRuleTargeting from './ConfigItemRuleTargeting'
import Query from './Query'

type TargetingPredicate = (
  query: Query
) => (targeting: ConfigItemRuleTargeting) => boolean

export default TargetingPredicate
