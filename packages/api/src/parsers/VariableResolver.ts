import {
  type ZodTypeAny,
  function as functionParser,
  union,
  ZodFirstPartyTypeKind,
  type ZodUnion,
  type ZodEffects,
  type ZodFunction,
  type ZodTuple,
  type ZodUnknown,
  type output,
  type input,
  type ZodObject,
  type AnyZodObject,
} from 'zod'
import { objectEntries } from '../util'

export function attachVariablePreprocessor<Parser extends ZodTypeAny>(
  parser: Parser,
): RecursivleyWithVariablePreprocessor<Parser> {
  switch (parser._def.typeName) {
    case ZodFirstPartyTypeKind.ZodObject:
      return attachToObject(
        parser as unknown as AnyZodObject,
      ) as RecursivleyWithVariablePreprocessor<Parser>

    default:
      return wrapVariablePreprocessorParser(
        parser,
      ) as RecursivleyWithVariablePreprocessor<Parser>
  }
}

function wrapVariablePreprocessorParser<Parser extends ZodTypeAny>(
  parser: Parser,
): WithVariablePreprocessor<Parser> {
  return union([
    parser,
    functionParser()
      .returns(parser)
      .transform((x) => x()),
  ])
}

function attachToObject<Parser extends AnyZodObject>(
  objectParser: Parser,
): RecursivleyWithVariablePreprocessor<Parser> {
  return wrapVariablePreprocessorParser(
    objectEntries(objectParser.shape).reduce<AnyZodObject>(
      (acc, [key, parser]) =>
        acc.setKey(key, attachVariablePreprocessor(parser)),
      objectParser,
    ),
  ) as RecursivleyWithVariablePreprocessor<Parser>
}

type WithVariablePreprocessor<Parser extends ZodTypeAny> = ZodUnion<
  [
    Parser,
    ZodEffects<
      ZodFunction<ZodTuple<[], ZodUnknown>, Parser>,
      output<Parser>,
      () => input<Parser>
    >,
  ]
>

export type RecursivleyWithVariablePreprocessor<Parser extends ZodTypeAny> =
  Parser extends AnyZodObject
    ? WithVariablePreprocessor<
        ZodObject<
          {
            [K in keyof Parser['shape']]: RecursivleyWithVariablePreprocessor<
              Parser['shape'][K]
            >
          },
          ZodObjectUnknownKeys<Parser>,
          ZodObjectCatchall<Parser>
        >
      >
    : WithVariablePreprocessor<Parser>

type ZodObjectUnknownKeys<T extends AnyZodObject> =
  T extends ZodObject<any, infer V> ? V : never

type ZodObjectCatchall<T extends AnyZodObject> =
  T extends ZodObject<any, any, infer V> ? V : never
