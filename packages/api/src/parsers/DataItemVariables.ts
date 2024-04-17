import { strictObject, type ZodRawShape } from 'zod'
import { DataItemRulesParser } from './DataItemRules'
import { objectMap } from '../util'
import { ZodPartialObject } from '../types'

export function DataItemVariablesParser<
  Vs extends ZodRawShape,
  T extends ZodRawShape,
  Q extends ZodRawShape,
>(
  variableParsers: Vs,
  targeting: T,
  query: Q,
): DataItemVariablesParser<Vs, T, Q> {
  return strictObject(
    objectMap(
      variableParsers,
      (parser) => DataItemRulesParser(parser, targeting, {}, query) as any,
    ),
  ).partial() as DataItemVariablesParser<Vs, T, Q>
}

export type DataItemVariablesParser<
  Vs extends ZodRawShape,
  Targeting extends ZodRawShape,
  Query extends ZodRawShape,
> = ZodPartialObject<
  {
    [K in keyof Vs]: DataItemRulesParser<Vs[K], Targeting, {}, Query>
  },
  'strict'
>
