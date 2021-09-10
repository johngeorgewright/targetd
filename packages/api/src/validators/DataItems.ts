import * as rt from 'runtypes'
import { objectMap } from '../util'
import DataItem from './DataItem'

function DataItems<
  D extends Record<string, rt.Runtype>,
  T extends Record<string, rt.Runtype>
>(dataValidators: D, targeting: T) {
  return rt.Partial(
    objectMap(dataValidators, (Payload) => DataItem(Payload, targeting))
  )
}

type DataItems<
  DataTypes extends Record<string, rt.Runtype>,
  Targeting extends Record<string, rt.Runtype>
> = rt.Partial<
  {
    [Name in keyof DataTypes]: DataItem<DataTypes[Name], Targeting>
  },
  false
>

export default DataItems
