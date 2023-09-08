import z from 'zod'
import { ZodPartialObject } from '../types'

function DataItemRule<
  P extends z.ZodTypeAny,
  T extends z.ZodRawShape,
  CT extends z.ZodRawShape
>(Payload: P, targeting: T, fallThroughTargeting: CT): DataItemRule<P, T, CT> {
  const ServedRule = RuleWithPayload(Payload, targeting)

  const FallThroughRule = ServedRule.omit({ payload: true }).extend({
    fallThrough: z.array(RuleWithPayload(Payload, fallThroughTargeting)),
  })

  return ServedRule.or(FallThroughRule)
}

type DataItemRule<
  Payload extends z.ZodTypeAny,
  Targeting extends z.ZodRawShape,
  FallThroughTargeting extends z.ZodRawShape
> = z.ZodUnion<
  [
    RuleWithPayload<Payload, Targeting>,
    z.ZodObject<
      {
        targeting: z.ZodOptional<ZodPartialObject<Targeting, 'strict'>>
        fallThrough: z.ZodArray<RuleWithPayload<Payload, FallThroughTargeting>>
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
