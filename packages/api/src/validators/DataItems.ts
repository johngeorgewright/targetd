import * as z from 'zod'
import DataItem from './DataItem'

function DataItems<D extends z.ZodRawShape, T extends z.ZodRawShape>(
  dataValidators: D,
  targeting: T
): DataItems<D, T> {
  const dataItems: Record<string, any> = {}
  for (const [key, payload] of Object.entries(dataValidators))
    dataItems[key] = DataItem(payload, targeting)
  return z.object(dataItems).partial() as DataItems<D, T>
}

type DataItems<
  DataTypes extends z.ZodRawShape,
  Targeting extends z.ZodRawShape
> = z.ZodObject<{
  [K in keyof DataTypes]: z.ZodOptional<DataItem<DataTypes[K], Targeting>>
}>

// type DataItems<
//   DataTypes extends z.ZodRawShape,
//   Targeting extends z.ZodRawShape
// > = ReturnType<typeof DataItems<DataTypes, Targeting>>

export default DataItems
