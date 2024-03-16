import {
  type ZodObject,
  type ZodRawShape,
  type ZodTypeAny,
  strictObject,
  ZodOptional,
} from 'zod'
import { DataItemRulesParser } from './DataItemRules'
import { DataItemVariablesParser } from './DataItemVariables'

export function DataItemParser<
  P extends ZodTypeAny,
  T extends ZodRawShape,
  FTT extends ZodRawShape,
  Vs extends ZodRawShape,
>(
  Payload: P,
  targeting: T,
  fallThroughTargeting: FTT,
  variables: Vs,
): DataItemParser<P, T, FTT, Vs> {
  const variablesParser = DataItemVariablesParser(
    variables,
    targeting,
    fallThroughTargeting,
  ).optional()

  return strictObject({
    rules: DataItemRulesParser(Payload, targeting, fallThroughTargeting),
    variables: variablesParser,
  })
}

export type DataItemParser<
  Payload extends ZodTypeAny,
  Targeting extends ZodRawShape,
  FallThroughTargeting extends ZodRawShape,
  VariableRules extends ZodRawShape,
> = ZodObject<
  {
    rules: DataItemRulesParser<Payload, Targeting, FallThroughTargeting>
    variables: ZodOptional<
      DataItemVariablesParser<VariableRules, Targeting, FallThroughTargeting>
    >
  },
  'strict'
>
