import {
  type ZodObject,
  type ZodRawShape,
  type ZodTypeAny,
  strictObject,
} from 'zod'
import DataItemRules from './DataItemRules'

function DataItem<
  P extends ZodTypeAny,
  T extends ZodRawShape,
  FTT extends ZodRawShape,
>(Payload: P, targeting: T, fallThroughTargeting: FTT): DataItem<P, T, FTT> {
  return strictObject({
    rules: DataItemRules(Payload, targeting, fallThroughTargeting),
  })
}

type DataItem<
  Payload extends ZodTypeAny,
  Targeting extends ZodRawShape,
  FallThroughTargeting extends ZodRawShape,
> = ZodObject<
  {
    rules: DataItemRules<Payload, Targeting, FallThroughTargeting>
  },
  'strict'
>

export default DataItem
