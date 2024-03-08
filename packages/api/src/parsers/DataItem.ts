import {
  type ZodObject,
  type ZodRawShape,
  type ZodTypeAny,
  strictObject,
} from 'zod'
import { DataItemRulesParser } from './DataItemRules'

export function DataItemParser<
  P extends ZodTypeAny,
  T extends ZodRawShape,
  FTT extends ZodRawShape,
>(
  Payload: P,
  targeting: T,
  fallThroughTargeting: FTT,
): DataItemParser<P, T, FTT> {
  return strictObject({
    rules: DataItemRulesParser(Payload, targeting, fallThroughTargeting),
  })
}

export type DataItemParser<
  Payload extends ZodTypeAny,
  Targeting extends ZodRawShape,
  FallThroughTargeting extends ZodRawShape,
> = ZodObject<
  {
    rules: DataItemRulesParser<Payload, Targeting, FallThroughTargeting>
  },
  'strict'
>
