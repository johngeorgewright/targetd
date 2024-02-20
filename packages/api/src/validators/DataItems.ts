import { type ZodRawShape, strictObject } from 'zod'
import { type ZodPartialObject } from '../types'
import DataItem from './DataItem'

function DataItems<
  D extends ZodRawShape,
  T extends ZodRawShape,
  CT extends ZodRawShape,
>(dataValidators: D, targeting: T, fallThroughTargeting: CT) {
  const dataItems: Record<string, any> = {}
  for (const [key, Payload] of Object.entries(dataValidators))
    dataItems[key] = DataItem(Payload, targeting, fallThroughTargeting)
  return strictObject(dataItems).partial() as DataItems<D, T, CT>
}

type DataItems<
  DataTypes extends ZodRawShape,
  Targeting extends ZodRawShape,
  FallThroughTargeting extends ZodRawShape,
> = ZodPartialObject<
  {
    [Name in keyof DataTypes]: DataItem<
      DataTypes[Name],
      Targeting,
      FallThroughTargeting
    >
  },
  'strict'
>

export default DataItems
