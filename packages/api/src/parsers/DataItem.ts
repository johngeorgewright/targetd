import { strictObject, type ZodMiniObject } from 'zod/v4-mini'
import type { $strict, $ZodShape, $ZodType } from 'zod/v4/core'
import {
  type DataItemRulesIn,
  type DataItemRulesOut,
  DataItemRulesParser,
} from './DataItemRules.ts'

export function DataItemParser<
  P extends $ZodType,
  T extends $ZodShape,
  FTT extends $ZodShape,
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
  Payload extends $ZodType,
  Targeting extends $ZodShape,
  FallThroughTargeting extends $ZodShape,
> = ZodMiniObject<
  {
    rules: DataItemRulesParser<Payload, Targeting, FallThroughTargeting>
  },
  $strict
>

export interface DataItemIn<
  Payload extends $ZodType,
  Targeting extends $ZodShape,
  FallThroughTargeting extends $ZodShape,
> {
  rules: DataItemRulesIn<Payload, Targeting, FallThroughTargeting>
}

export interface DataItemOut<
  Payload extends $ZodType,
  Targeting extends $ZodShape,
  FallThroughTargeting extends $ZodShape,
> {
  rules: DataItemRulesOut<Payload, Targeting, FallThroughTargeting>
}
