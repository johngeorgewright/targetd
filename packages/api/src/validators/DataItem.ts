import z from 'zod'
import DataItemRules from './DataItemRules'

function DataItem<
  P extends z.ZodTypeAny,
  T extends z.ZodRawShape,
  FTT extends z.ZodRawShape
>(Payload: P, targeting: T, fallThroughTargeting: FTT): DataItem<P, T, FTT> {
  return z.strictObject({
    rules: DataItemRules(Payload, targeting, fallThroughTargeting),
  })
}

type DataItem<
  Payload extends z.ZodTypeAny,
  Targeting extends z.ZodRawShape,
  FallThroughTargeting extends z.ZodRawShape
> = z.ZodObject<
  {
    rules: DataItemRules<Payload, Targeting, FallThroughTargeting>
  },
  'strict'
>

export default DataItem
