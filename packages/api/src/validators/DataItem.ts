import z from 'zod'
import DataItemRule from './DataItemRule'

function DataItem<P extends z.ZodTypeAny, T extends z.ZodRawShape>(
  Payload: P,
  targeting: T
): DataItem<P, T> {
  return z.strictObject({
    $schema: z.string().optional(),
    rules: z.array(DataItemRule(Payload, targeting)),
  })
}

type DataItem<
  Payload extends z.ZodTypeAny,
  Targeting extends z.ZodRawShape
> = z.ZodObject<
  {
    $schema: z.ZodOptional<z.ZodString>
    rules: z.ZodArray<DataItemRule<Payload, Targeting>>
  },
  'strict'
>

export default DataItem
