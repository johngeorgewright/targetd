import * as rt from 'runtypes'
import { objectMap } from '../util'
import ConfigItem from './ConfigItem'

function ConfigItems<
  DT extends Record<string, rt.Runtype>,
  T extends rt.Record<any, any>
>(dataTypes: DT, Targeting: T) {
  return rt.Record(
    objectMap(dataTypes, (Payload) => ConfigItem(Payload, Targeting))
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
