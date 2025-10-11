import {
  _default,
  strictObject,
  type ZodMiniAny,
  type ZodMiniDefault,
  type ZodMiniObject,
} from 'zod/mini'
import type { $strict, $ZodType } from 'zod/v4/core'
import {
  type DataItemRulesIn,
  type DataItemRulesOut,
  DataItemRulesParser,
} from './DataItemRules.ts'
import { DataItemVariablesParser } from './DataItemVariablesParser.ts'
import { variablesFor } from './variablesRegistry.ts'
import type * as DT from '../types/Data.ts'

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
  $ extends DT.Meta,
  PayloadParser extends $ZodType,
>(
  Payload: PayloadParser,
  targeting: $['TargetingParsers'],
  fallThroughTargeting: $['FallThroughTargetingParsers'],
  strictTargeting: boolean,
): DataItemParser<$, PayloadParser> {
  const variablesRegistry = variablesFor(Payload)
  return strictObject({
    rules: DataItemRulesParser(
      variablesRegistry,
      Payload,
      targeting,
      fallThroughTargeting,
      strictTargeting,
    ),
    variables: _default(
      DataItemVariablesParser(
        variablesRegistry,
        targeting,
        fallThroughTargeting,
        strictTargeting,
      ),
      {},
    ),
  })
}

export type DataItemParser<
  $ extends DT.Meta,
  PayloadParser extends $ZodType,
> = ZodMiniObject<
  {
    rules: DataItemRulesParser<$, PayloadParser>
    variables: ZodMiniDefault<DataItemVariablesParser<$>>
  },
  $strict
>

/**
 * The data shape expected for {@link DataItemParser} inputs.
 */
export interface DataItemIn<
  $ extends DT.Meta,
  PayloadParser extends $ZodType,
> {
  rules: DataItemRulesIn<$, PayloadParser>
  variables?: Record<
    string,
    DataItemRulesIn<$, ZodMiniAny>
  >
}

/**
 * The data shape expected for {@link DataItemParser} outputs.
 */
export interface DataItemOut<
  $ extends DT.Meta,
  PayloadParser extends $ZodType,
> {
  rules: DataItemRulesOut<$, PayloadParser>
  variables: Record<
    string,
    DataItemRulesOut<$, ZodMiniAny>
  >
}
