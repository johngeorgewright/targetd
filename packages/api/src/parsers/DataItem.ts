import { strictObject, type ZodMiniObject } from 'zod/v4-mini'
import type { $strict, $ZodShape, $ZodType } from 'zod/v4/core'
import {
  type DataItemRulesIn,
  type DataItemRulesOut,
  DataItemRulesParser,
} from './DataItemRules.ts'

/**
 * Parses an "item".
 *
 * An item, within the Data class, contains all the details of that piece
 * of data.
 *
 * @remarks
 * Currently this is just restricted to `rules`.
 */
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

/**
 * The data shape expected for {@link DataItemParser} inputs.
 */
export interface DataItemIn<
  Payload extends $ZodType,
  Targeting extends $ZodShape,
  FallThroughTargeting extends $ZodShape,
> {
  rules: DataItemRulesIn<Payload, Targeting, FallThroughTargeting>
}

/**
 * The data shape expected for {@link DataItemParser} outputs.
 */
export interface DataItemOut<
  Payload extends $ZodType,
  Targeting extends $ZodShape,
  FallThroughTargeting extends $ZodShape,
> {
  rules: DataItemRulesOut<Payload, Targeting, FallThroughTargeting>
}
