import ConfigItemRuleTargeting from './ConfigItemRuleTargeting'

export default interface ConfigItemRule {
  payload: unknown
  targeting: ConfigItemRuleTargeting
}
