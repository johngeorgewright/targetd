import {
  strictObject,
  type ZodObject,
  type ZodOptional,
  type ZodRawShape,
  type ZodTypeAny,
} from 'zod'
import { DataItemRulesParser } from './DataItemRules'
import { DataItemVariablesParser } from './DataItemVariables'

export function DataItemParser<
  P extends ZodTypeAny,
  T extends ZodRawShape,
  FTT extends ZodRawShape,
  Q extends ZodRawShape,
  Vs extends ZodRawShape | undefined,
>(
  Payload: P,
  targeting: T,
  fallThroughTargeting: FTT,
  query: Q,
  variables: Vs,
): DataItemParser<P, T, FTT, Q, Vs> {
  return strictObject({
    rules: DataItemRulesParser(Payload, targeting, fallThroughTargeting, query),
    variables: DataItemVariablesParser(
      variables || {},
      targeting,
      query,
    ).optional(),
  }) as DataItemParser<P, T, FTT, Q, Vs>
}

export type DataItemParser<
  Payload extends ZodTypeAny,
  Targeting extends ZodRawShape,
  FallThroughTargeting extends ZodRawShape,
  Query extends ZodRawShape,
  VariableRules extends ZodRawShape | undefined,
> = ZodObject<
  {
    rules: DataItemRulesParser<Payload, Targeting, FallThroughTargeting, Query>
    variables: ZodOptional<
      DataItemVariablesParser<
        VariableRules extends ZodRawShape ? VariableRules : {},
        Targeting,
        Query
      >
    >
  },
  'strict'
>
