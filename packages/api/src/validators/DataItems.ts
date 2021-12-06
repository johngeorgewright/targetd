import * as rt from 'runtypes'
import DataItem from './DataItem'

function DataItems<
  D extends Record<string, rt.Runtype>,
  T extends Record<string, rt.Runtype>
>(dataValidators: D, targeting: T) {
  const dataItems: Record<string, any> = {}
  for (const [key, Payload] of Object.entries(dataValidators)) {
    dataItems[key] = DataItem(Payload, targeting)
  }
  return dataItems as DataItems<D, T>
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
