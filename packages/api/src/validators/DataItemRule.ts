import z from 'zod'
import { ZodPartialObject } from '../types'

function DataItemRule<
  P extends z.ZodTypeAny,
  T extends z.ZodRawShape,
  CT extends z.ZodRawShape
>(Payload: P, targeting: T, clientTargeting: CT): DataItemRule<P, T, CT> {
  const ServedRule = RuleWithPayload(Payload, targeting)

  const ClientDataItemRule = z.strictObject({
    targeting: ServedRule.shape.targeting,
    client: z.array(RuleWithPayload(Payload, clientTargeting)),
  })

  return ServedRule.or(ClientDataItemRule)
}

type DataItemRule<
  Payload extends z.ZodTypeAny,
  Targeting extends z.ZodRawShape,
  ClientTargeting extends z.ZodRawShape
> = z.ZodUnion<
  [
    RuleWithPayload<Payload, Targeting>,
    z.ZodObject<
      {
        targeting: z.ZodOptional<ZodPartialObject<Targeting, 'strict'>>
        client: z.ZodArray<RuleWithPayload<Payload, ClientTargeting>>
      },
      'strict'
    >
  ]
>

export default DataItemRule

export type RuleWithPayload<
  Payload extends z.ZodTypeAny,
  Targeting extends z.ZodRawShape
> = z.ZodObject<
  {
    targeting: z.ZodOptional<ZodPartialObject<Targeting, 'strict'>>
    payload: Payload
  },
  'strict'
>

export function RuleWithPayload<
  P extends z.ZodTypeAny,
  T extends z.ZodRawShape
>(Payload: P, targeting: T): RuleWithPayload<P, T> {
  return z.strictObject({
    targeting: z.strictObject(targeting).partial().optional(),
    payload: Payload,
  })
}
