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
import type { $ZodArray, $ZodObject, $ZodRecord, $ZodType } from 'zod/v4/core'
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
      ) as unknown as RecursiveVariableResolver<Parser>

    case 'record':
      return recordVariableResolverParser(
        variablesRegistry,
        parser as unknown as $ZodRecord,
      ) as RecursiveVariableResolver<Parser>

    case 'array':
      return arrayVariableResolverParser(
        variablesRegistry,
        parser as unknown as $ZodArray,
      ) as RecursiveVariableResolver<Parser>

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
        variableStringParser(),
        DataItemVariableResolverParser(variablesRegistry, parser),
      ],
      [any(), parser],
    ])) as WithVariableResolver<Parser>
}

function arrayVariableResolverParser<Parser extends $ZodArray>(
  variablesRegistry: VariablesRegistry,
  arrayParser: Parser,
): RecursiveVariableResolver<Parser> {
  const $arrayParser = new arrayParser._zod.constr({
    ...arrayParser._zod.def,
    element: attachVariableResolver(
      variablesRegistry,
      arrayParser._zod.def.element,
    ),
  })
  return variableResolverParser(
    variablesRegistry,
    $arrayParser,
  ) as RecursiveVariableResolver<Parser>
}

function recordVariableResolverParser<Parser extends $ZodRecord>(
  variablesRegistry: VariablesRegistry,
  recordParser: Parser,
): RecursiveVariableResolver<Parser> {
  const $recordParser = new recordParser._zod.constr({
    ...recordParser._zod.def,
    valueType: attachVariableResolver(
      variablesRegistry,
      recordParser._zod.def.valueType,
    ),
  })
  return variableResolverParser(
    variablesRegistry,
    $recordParser,
  ) as RecursiveVariableResolver<Parser>
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
> = Parser extends $ZodArray ? WithVariableResolver<
    $ZodArray<
      RecursiveVariableResolver<Parser['_zod']['def']['element']>
    >
  >
  : Parser extends $ZodRecord ? WithVariableResolver<
      $ZodRecord<
        Parser['_zod']['def']['keyType'],
        RecursiveVariableResolver<Parser['_zod']['def']['valueType']>
      >
    >
  : Parser extends $ZodObject ? WithVariableResolver<
      $ZodObject<
        {
          [K in keyof Parser['_zod']['def']['shape']]:
            RecursiveVariableResolver<
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
