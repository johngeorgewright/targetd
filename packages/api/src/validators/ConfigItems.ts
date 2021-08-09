import * as rt from 'runtypes'
import { objectMap } from '../util'
import ConfigItem from './ConfigItem'

function ConfigItems<
  D extends Record<string, rt.Runtype>,
  T extends Record<string, rt.Runtype>
>(dataValidators: D, targeting: T) {
  return rt.Record(
    objectMap(dataValidators, (Payload) => ConfigItem(Payload, targeting))
  )
}

type ConfigItems<
  DataTypes extends Record<string, rt.Runtype>,
  Targeting extends Record<string, rt.Runtype>
> = rt.Record<
  {
    [Name in keyof DataTypes]: ConfigItem<DataTypes[Name], Targeting>
  },
  false
>

export default ConfigItems
