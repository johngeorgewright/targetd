import ConfigItemRuleTargeting from './ConfigItemRuleTargeting'
import Query from './Query'

type TargetingPredicate<Extra extends Record<string, unknown> = {}> = (
  query: Query
) => (targeting: ConfigItemRuleTargeting & Extra) => boolean

export default TargetingPredicate

export type ExtractExtraTargetingProperties<T extends TargetingPredicate> =
  T extends TargetingPredicate<infer Extra> ? Extra : never
