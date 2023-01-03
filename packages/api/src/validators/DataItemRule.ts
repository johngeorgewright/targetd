import z from 'zod'
import { ZodPartialObject } from '../types'

function DataItemRule<P extends z.ZodTypeAny, T extends z.ZodRawShape>(
  Payload: P,
  targeting: T
): DataItemRule<P, T> {
  const Targeting = z.object(targeting).partial().optional()

  const RuleWithPayload = z.object({
    targeting: Targeting,
    payload: Payload,
  })

  const ClientDataItemRule = z.object({
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
    z.ZodObject<{
      targeting: z.ZodOptional<ZodPartialObject<Targeting>>
      client: z.ZodArray<RuleWithPayload<Payload, Targeting>>
    }>
  ]
>

export default DataItemRule

export type RuleWithPayload<
  Payload extends z.ZodTypeAny,
  Targeting extends z.ZodRawShape
> = z.ZodObject<{
  targeting: z.ZodOptional<ZodPartialObject<Targeting>>
  payload: Payload
}>
