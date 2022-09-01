import * as z from 'zod'
import { ZodPartialObject } from '../types'

function DataItemRule<P extends z.ZodTypeAny, T extends z.ZodRawShape>(
  payload: P,
  targetingRawShape: T
) {
  const targeting = z.object(targetingRawShape).partial().optional()

  const ruleWithPayload = z.object({
    targeting,
    payload,
  })

  const clientDataItemRule = z.object({
    targeting,
    client: z.array(ruleWithPayload),
  })

  return ruleWithPayload.or(clientDataItemRule)
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
