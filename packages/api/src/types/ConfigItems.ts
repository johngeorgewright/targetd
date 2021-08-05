import * as rt from 'runtypes'
import { objectMap } from '../util'
import ConfigItem from './ConfigItem'

function ConfigItems<
  D extends Record<string, rt.Runtype>,
  T extends rt.Record<any, any>
>(dataValidators: D, Targeting: T) {
  return rt.Record(
    objectMap(dataValidators, (Payload) => ConfigItem(Payload, Targeting))
  )
}

type ConfigItems<
  DataTypes extends Record<string, rt.Runtype>,
  Targeting extends rt.Record<any, any>
> = rt.Record<
  {
    [Name in keyof DataTypes]: ConfigItem<DataTypes[Name], Targeting>
  },
  false
>

export default ConfigItems
