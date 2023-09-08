import z from 'zod'
import DataItemRule from './DataItemRule'

function DataItem<
  P extends z.ZodTypeAny,
  T extends z.ZodRawShape,
  CT extends z.ZodRawShape
>(Payload: P, targeting: T, fallThroughTargeting: CT): DataItem<P, T, CT> {
  return z.strictObject({
    rules: z.array(DataItemRule(Payload, targeting, fallThroughTargeting)),
  })
}

type DataItem<
  Payload extends z.ZodTypeAny,
  Targeting extends z.ZodRawShape,
  FallThroughTargeting extends z.ZodRawShape
> = z.ZodObject<
  {
    rules: z.ZodArray<DataItemRule<Payload, Targeting, FallThroughTargeting>>
  },
  'strict'
>

export default DataItem
