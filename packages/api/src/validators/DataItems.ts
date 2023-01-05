import z from 'zod'
import { ZodPartialObject } from '../types'
import DataItem from './DataItem'

function DataItems<D extends z.ZodRawShape, T extends z.ZodRawShape>(
  dataValidators: D,
  targeting: T
): DataItems<D, T> {
  const dataItems: Record<string, any> = {}
  for (const [key, Payload] of Object.entries(dataValidators)) {
    dataItems[key] = DataItem(Payload, targeting)
  }
  return z.strictObject(dataItems).partial() as DataItems<D, T>
}

type DataItems<
  DataTypes extends z.ZodRawShape,
  Targeting extends z.ZodRawShape
> = ZodPartialObject<
  {
    [Name in keyof DataTypes]: DataItem<DataTypes[Name], Targeting>
  },
  'strict'
>

export default DataItems
