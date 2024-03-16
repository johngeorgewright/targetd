import { strictObject, type ZodRawShape } from 'zod'
import { DataItemRulesParser } from './DataItemRules'
import { objectMap } from '../util'
import { ZodPartialObject } from '../types'

export function DataItemVariablesParser<
  Vs extends ZodRawShape,
  T extends ZodRawShape,
  FTT extends ZodRawShape,
>(
  variableParsers: Vs,
  targeting: T,
  fallThroughTargeting: FTT,
): DataItemVariablesParser<Vs, T, FTT> {
  return strictObject(
    objectMap(
      variableParsers,
      (parser) =>
        DataItemRulesParser(parser, targeting, fallThroughTargeting) as any,
    ),
  ).partial() as DataItemVariablesParser<Vs, T, FTT>
}

export type DataItemVariablesParser<
  Vs extends ZodRawShape,
  Targeting extends ZodRawShape,
  FallThroughTargeting extends ZodRawShape,
> = ZodPartialObject<
  {
    [K in keyof Vs]: DataItemRulesParser<Vs[K], Targeting, FallThroughTargeting>
  },
  'strict'
>
