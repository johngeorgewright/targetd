import { Array, Record, Static, String } from 'runtypes'
import ConfigItemRule from './ConfigItemRule'

const ConfigItem = Record({
  name: String,
  rules: Array(ConfigItemRule),
})

type ConfigItem = Static<typeof ConfigItem>

export default ConfigItem
