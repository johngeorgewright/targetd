import { Array, Boolean, Dictionary, Number, Static, String } from 'runtypes'

export const ConfigItemRuleTargetingValue = Array(String)
  .Or(Array(Number))
  .Or(Boolean)

export type ConfigItemRuleTargetingValue = Static<
  typeof ConfigItemRuleTargetingValue
>

const ConfigItemRuleTargeting = Dictionary(ConfigItemRuleTargetingValue, String)

type ConfigItemRuleTargeting = Static<typeof ConfigItemRuleTargeting>

export default ConfigItemRuleTargeting
