import type { $ZodShape } from 'zod/v4/core'
import {
  any,
  record,
  string,
  type ZodMiniAny,
  type ZodMiniRecord,
  type ZodMiniString,
} from 'zod/mini'
import { DataItemRulesParser } from './DataItemRules.ts'

export function DataItemVariablesParser<
  T extends $ZodShape,
  FTT extends $ZodShape,
>(targeting: T, fallThroughTargeting: FTT): DataItemVariablesParser<T, FTT> {
  return record(
    string(),
    DataItemRulesParser(any(), targeting, fallThroughTargeting),
  )
}

export type DataItemVariablesParser<
  Targeting extends $ZodShape,
  FallThroughTargeting extends $ZodShape,
> = ZodMiniRecord<
  ZodMiniString<string>,
  DataItemRulesParser<ZodMiniAny, Targeting, FallThroughTargeting>
>
