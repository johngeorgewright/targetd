import z from 'zod'
import DataItemRule from './DataItemRule'

function DataItem<P extends z.ZodTypeAny, T extends z.ZodRawShape>(
  Payload: P,
  targeting: T
): DataItem<P, T> {
  return z.strictObject({
    rules: z.array(DataItemRule(Payload, targeting)),
  })
}

type DataItem<
  Payload extends z.ZodTypeAny,
  Targeting extends z.ZodRawShape
> = z.ZodObject<
  {
    rules: z.ZodArray<DataItemRule<Payload, Targeting>>
  },
  'strict'
>

export default DataItem
