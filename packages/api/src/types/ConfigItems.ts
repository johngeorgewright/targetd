import { Array, Record } from 'runtypes'
import ConfigItem from './ConfigItem'

function ConfigItems<T extends Record<any, any>>(Targeting: T) {
  return Array(ConfigItem(Targeting))
}

type ConfigItems<Targeting extends Record<any, any>> = Array<
  ConfigItem<Targeting>,
  false
>

export default ConfigItems
