import { Array, Boolean, Dictionary, Number, Static, String } from "runtypes"

const ConfigItemRuleTargeting = Dictionary(
  Array(String).Or(Array(Number)).Or(Boolean), String)

type ConfigItemRuleTargeting = Static(typeof ConfigItemRuleTargeting)

export default ConfigItemRuleTargeting
