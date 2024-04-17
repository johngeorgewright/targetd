import {
  function as functionParser,
  strictObject,
  promise,
  type ZodRawShape,
  type ZodTypeAny,
  type ZodFunction,
  type ZodTuple,
  type ZodUnknown,
  type ZodPromise,
} from 'zod'
import { ZodPartialObject } from '../types'

export function DataItemVariableResolverParser<
  Parser extends ZodTypeAny,
  QueryParsers extends ZodRawShape,
>(parser: Parser, queryParsers: QueryParsers) {
  return functionParser()
    .args(strictObject(queryParsers).partial())
    .returns(promise(parser))
}

export type DataItemVariableResolverParser<
  Parser extends ZodTypeAny,
  QueryParsers extends ZodRawShape,
> = ZodFunction<
  ZodTuple<[ZodPartialObject<QueryParsers, 'strict'>], ZodUnknown>,
  ZodPromise<Parser>
>
