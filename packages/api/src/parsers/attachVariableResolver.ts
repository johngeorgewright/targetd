import {
  type output,
  pipe,
  safeExtend,
  transform,
  type ZodMiniAny,
  ZodMiniObject,
  type ZodMiniPipe,
  type ZodMiniTransform,
} from 'zod/mini'
import { objectEntries } from '../util.ts'
import {
  DataItemVariableResolverParser,
  DataItemVariableResolverTransformer,
  type VariableStringParser,
  variableStringParser,
} from './DataItemVariableResolver.ts'
import type { $ZodObject, $ZodType } from 'zod/v4/core'
import { any, type ZodObject } from 'zod'
import { type ZodSwitch, zodSwitch } from './switch.ts'
import type { VariablesRegistry } from './variablesRegistry.ts'

export function attachVariableResolver<
  Parser extends $ZodType,
>(
  variablesRegistry: VariablesRegistry,
  parser: Parser,
): RecursiveVariableResolver<Parser> {
  switch (parser._zod.def.type) {
    case 'object':
      return objectVariableResolverParser(
        variablesRegistry,
        parser as unknown as (ZodObject | ZodMiniObject),
      ) as any

    default:
      return variableResolverParser(
        variablesRegistry,
        parser,
      ) as RecursiveVariableResolver<Parser>
  }
}

function variableResolverParser<
  Parser extends $ZodType,
>(
  variablesRegistry: VariablesRegistry,
  parser: Parser,
): WithVariableResolver<Parser> {
  return (parser._zod.def.type === 'string'
    ? pipe(
      parser,
      transform((input, ctx) =>
        DataItemVariableResolverTransformer(
          variablesRegistry,
          parser,
          input as string,
          ctx,
        )
      ),
    )
    : zodSwitch([
      [
        variableStringParser,
        DataItemVariableResolverParser(variablesRegistry, parser),
      ],
      [any(), parser],
    ])) as WithVariableResolver<Parser>
}

function objectVariableResolverParser<
  Parser extends ZodObject | ZodMiniObject,
>(
  variablesRegistry: VariablesRegistry,
  objectParser: Parser,
): RecursiveVariableResolver<Parser> {
  const $objectParser = objectParser instanceof ZodMiniObject
    ? objectEntries(objectParser._zod.def.shape).reduce<ZodMiniObject>(
      (acc, [key, parser]) =>
        safeExtend(acc, {
          [key]: attachVariableResolver(variablesRegistry, parser),
        }),
      objectParser,
    )
    : objectEntries(objectParser._zod.def.shape).reduce<ZodObject>(
      (acc, [key, parser]) =>
        acc.safeExtend({
          [key]: attachVariableResolver(variablesRegistry, parser) as any,
        }),
      objectParser,
    )

  return variableResolverParser(
    variablesRegistry,
    $objectParser,
  ) as RecursiveVariableResolver<
    Parser
  >
}

type WithVariableResolver<
  Parser extends $ZodType,
> = Parser['_zod']['def']['type'] extends 'string'
  ? ZodMiniPipe<Parser, ZodMiniTransform<unknown, output<Parser>>>
  : ZodSwitch<[
    [VariableStringParser, DataItemVariableResolverParser],
    [ZodMiniAny, Parser],
  ]>

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
