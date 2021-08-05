import { Array, Record, Runtype } from 'runtypes'
import ConfigItemRule from './ConfigItemRule'

function ConfigItem<P extends Runtype, T extends Record<any, any>>(
  Payload: P,
  Targeting: T
) {
  return Record({
    rules: Array(ConfigItemRule(Payload, Targeting)),
  })
}

type ConfigItem<
  Payload extends Runtype,
  Targeting extends Record<any, any>
> = Record<
  {
    rules: Array<ConfigItemRule<Payload, Targeting>, false>
  },
  false
>

export default ConfigItem
