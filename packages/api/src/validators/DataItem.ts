import * as z from 'zod'
import DataItemRule from './DataItemRule'

function DataItem<P extends z.ZodTypeAny, T extends z.ZodRawShape>(
  payload: P,
  targeting: T
) {
  return z.object({
    rules: z.array(DataItemRule(payload, targeting)),
  })
}

type DataItem<
  Payload extends z.ZodTypeAny,
  Targeting extends z.ZodRawShape
> = z.ZodObject<{
  rules: z.ZodArray<DataItemRule<Payload, Targeting>>
}>

export default DataItem
