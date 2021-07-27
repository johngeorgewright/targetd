import { Array, Record, Static, Unknown } from 'runtypes'
import ConfigItemRuleTargeting from './ConfigItemRuleTargeting'

const RuleBase = Record({
  targeting: ConfigItemRuleTargeting.optional(),
})

const RuleWithPayload = RuleBase.extend({
  payload: Unknown,
})

export const ClientConfigItemRule = RuleBase.extend({
  client: Array(RuleWithPayload),
})

export type ClientConfigItemRule = Static<typeof ClientConfigItemRule>

const ConfigItemRule = RuleWithPayload.Or(ClientConfigItemRule)

type ConfigItemRule = Static<typeof ConfigItemRule>

export default ConfigItemRule


