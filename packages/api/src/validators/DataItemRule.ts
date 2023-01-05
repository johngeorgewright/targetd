import z from 'zod'
import { ZodPartialObject } from '../types'

function DataItemRule<P extends z.ZodTypeAny, T extends z.ZodRawShape>(
  Payload: P,
  targeting: T
): DataItemRule<P, T> {
  const Targeting = z.strictObject(targeting).partial().optional()

  const RuleWithPayload = z.strictObject({
    targeting: Targeting,
    payload: Payload,
  })

  const ClientDataItemRule = z.strictObject({
    targeting: Targeting,
    client: z.array(RuleWithPayload),
  })

  return RuleWithPayload.or(ClientDataItemRule)
}

type DataItemRule<
  Payload extends z.ZodTypeAny,
  Targeting extends z.ZodRawShape
> = z.ZodUnion<
  [
    RuleWithPayload<Payload, Targeting>,
    z.ZodObject<
      {
        targeting: z.ZodOptional<ZodPartialObject<Targeting, 'strict'>>
        client: z.ZodArray<RuleWithPayload<Payload, Targeting>>
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
