import {
  extend,
  pipe,
  transform,
  union,
  ZodMiniObject,
  type ZodMiniUnion,
} from 'zod/mini'
import { objectEntries } from '../util.ts'
import {
  DataItemVariableResolverParser,
  DataItemVariableResolverTransformer,
} from './DataItemVariableResolver.ts'
import type { $ZodObject, $ZodType } from 'zod/v4/core'
import type { ZodObject } from 'zod'

export function attachVariableResolver<
  Parser extends $ZodType,
>(
  parser: Parser,
): RecursiveVariableResolver<Parser> {
  switch (parser._zod.def.type) {
    case 'object':
      return objectVariableResolverParser(
        parser as unknown as (ZodObject | ZodMiniObject),
      ) as RecursiveVariableResolver<Parser>

    default:
      return variableResolverParser(
        parser,
      ) as RecursiveVariableResolver<Parser>
  }
}

function variableResolverParser<
  Parser extends $ZodType,
>(
  parser: Parser,
): WithVariableResolver<Parser> {
  return parser._zod.def.type === 'string'
    ? pipe(
      parser,
      transform(DataItemVariableResolverTransformer as any),
    ) as unknown as WithVariableResolver<Parser>
    : union([DataItemVariableResolverParser(), parser])
}

function objectVariableResolverParser<
  Parser extends ZodObject | ZodMiniObject,
>(
  objectParser: Parser,
): RecursiveVariableResolver<Parser> {
  const $objectParser = objectParser instanceof ZodMiniObject
    ? objectEntries(objectParser._zod.def.shape).reduce<ZodMiniObject>(
      (acc, [key, parser]) =>
        extend(acc, { [key]: attachVariableResolver(parser) }),
      objectParser,
    )
    : objectEntries(objectParser._zod.def.shape).reduce<ZodObject>(
      (acc, [key, parser]) =>
        acc.extend({ [key]: attachVariableResolver(parser) }),
      objectParser,
    )

  return variableResolverParser($objectParser) as RecursiveVariableResolver<
    Parser
  >
}

type WithVariableResolver<
  Parser extends $ZodType,
> = ZodMiniUnion<[DataItemVariableResolverParser, Parser]>

export type RecursiveVariableResolver<
  Parser extends $ZodType,
> = Parser extends $ZodObject ? WithVariableResolver<
    $ZodObject<
      {
        [K in keyof Parser['_zod']['def']['shape']]: RecursiveVariableResolver<
          Parser['_zod']['def']['shape'][K]
        >
      },
      ZodObjectConfig<Parser>
    >
  >
  : WithVariableResolver<Parser>

type ZodObjectConfig<T extends $ZodObject> = T extends $ZodObject<any, infer V>
  ? V
  : never
