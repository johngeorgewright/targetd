import z from 'zod'
import DataItemRule from './DataItemRule'

function DataItem<
  P extends z.ZodTypeAny,
  T extends z.ZodRawShape,
  CT extends z.ZodRawShape
>(Payload: P, targeting: T, clientTargeting: CT): DataItem<P, T, CT> {
  return z.strictObject({
    $schema: z.string().optional(),
    rules: z.array(DataItemRule(Payload, targeting, clientTargeting)),
  })
}

type DataItem<
  Payload extends z.ZodTypeAny,
  Targeting extends z.ZodRawShape,
  ClientTargeting extends z.ZodRawShape
> = z.ZodObject<
  {
    $schema: z.ZodOptional<z.ZodString>
    rules: z.ZodArray<DataItemRule<Payload, Targeting, ClientTargeting>>
  },
  'strict'
>

export default DataItem
