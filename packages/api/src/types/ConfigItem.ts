import { Array, Record, String } from 'runtypes'
import ConfigItemRule from './ConfigItemRule'

function ConfigItem<T extends Record<any, any>>(Targeting: T) {
  return Record({
    name: String,
    rules: Array(ConfigItemRule(Targeting)),
  })
}

type ConfigItem<Targeting extends Record<any, any>> = Record<
  {
    name: String
    rules: Array<ConfigItemRule<Targeting>, false>
  },
  false
>

export default ConfigItem
