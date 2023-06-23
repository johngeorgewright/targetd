import z from 'zod'
import { ZodPartialObject } from '../types'
import DataItem from './DataItem'

function DataItems<
  D extends z.ZodRawShape,
  T extends z.ZodRawShape,
  CT extends z.ZodRawShape
>(dataValidators: D, targeting: T, clientTargeting: CT): DataItems<D, T, CT> {
  const dataItems: Record<string, any> = {}
  for (const [key, Payload] of Object.entries(dataValidators))
    dataItems[key] = DataItem(Payload, targeting, clientTargeting)
  return z.strictObject(dataItems).partial() as DataItems<D, T, CT>
}

type DataItems<
  DataTypes extends z.ZodRawShape,
  Targeting extends z.ZodRawShape,
  ClientTargeting extends z.ZodRawShape
> = ZodPartialObject<
  {
    [Name in keyof DataTypes]: DataItem<
      DataTypes[Name],
      Targeting,
      ClientTargeting
    >
  },
  'strict'
>

export default DataItems
