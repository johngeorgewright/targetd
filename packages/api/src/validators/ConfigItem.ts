import * as rt from 'runtypes'
import ConfigItemRule from './ConfigItemRule'

function ConfigItem<P extends rt.Runtype, T extends Record<string, rt.Runtype>>(
  Payload: P,
  targeting: T
) {
  return rt.Record({
    rules: rt.Array(ConfigItemRule(Payload, targeting)),
  })
}

type ConfigItem<
  Payload extends rt.Runtype,
  Targeting extends Record<string, rt.Runtype>
> = rt.Record<
  {
    rules: rt.Array<ConfigItemRule<Payload, Targeting>, false>
  },
  false
>

export default ConfigItem
