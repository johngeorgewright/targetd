import {
  type ZodTypeAny,
  union,
  ZodFirstPartyTypeKind,
  type ZodUnion,
  type ZodObject,
  type AnyZodObject,
  type ZodRawShape,
} from 'zod'
import { objectEntries } from '../util'
import { DataItemVariableResolverParser } from './DataItemVariableResolver'

export function attachVariableResolver<
  Parser extends ZodTypeAny,
  QueryParsers extends ZodRawShape,
>(
  parser: Parser,
  queryParsers: QueryParsers,
): RecursivleyWithVariableResolver<Parser, QueryParsers> {
  switch (parser._def.typeName) {
    case ZodFirstPartyTypeKind.ZodObject:
      return attachToObject(
        parser as unknown as AnyZodObject,
        queryParsers,
      ) as RecursivleyWithVariableResolver<Parser, QueryParsers>

    default:
      return unionWithVariableResolverParser(
        parser,
        queryParsers,
      ) as RecursivleyWithVariableResolver<Parser, QueryParsers>
  }
}

function unionWithVariableResolverParser<
  Parser extends ZodTypeAny,
  QueryParsers extends ZodRawShape,
>(
  parser: Parser,
  queryParsers: QueryParsers,
): WithVariableResolver<Parser, QueryParsers> {
  return union([parser, DataItemVariableResolverParser(parser, queryParsers)])
}

function attachToObject<
  Parser extends AnyZodObject,
  QueryParsers extends ZodRawShape,
>(
  objectParser: Parser,
  queryParsers: QueryParsers,
): RecursivleyWithVariableResolver<Parser, QueryParsers> {
  return unionWithVariableResolverParser(
    objectEntries(objectParser.shape).reduce<AnyZodObject>(
      (acc, [key, parser]) =>
        acc.setKey(key, attachVariableResolver(parser, queryParsers)),
      objectParser,
    ),
    queryParsers,
  ) as RecursivleyWithVariableResolver<Parser, QueryParsers>
}

type WithVariableResolver<
  Parser extends ZodTypeAny,
  QueryParsers extends ZodRawShape,
> = ZodUnion<[Parser, DataItemVariableResolverParser<Parser, QueryParsers>]>

export type RecursivleyWithVariableResolver<
  Parser extends ZodTypeAny,
  QueryParsers extends ZodRawShape,
> = Parser extends AnyZodObject
  ? WithVariableResolver<
      ZodObject<
        {
          [K in keyof Parser['shape']]: RecursivleyWithVariableResolver<
            Parser['shape'][K],
            QueryParsers
          >
        },
        ZodObjectUnknownKeys<Parser>,
        ZodObjectCatchall<Parser>
      >,
      QueryParsers
    >
  : WithVariableResolver<Parser, QueryParsers>

type ZodObjectUnknownKeys<T extends AnyZodObject> =
  T extends ZodObject<any, infer V> ? V : never

type ZodObjectCatchall<T extends AnyZodObject> =
  T extends ZodObject<any, any, infer V> ? V : never
