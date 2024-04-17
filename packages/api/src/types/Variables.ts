import type { ZodRawShape, input } from 'zod'
import type { DataItemVariablesParser } from '../parsers/DataItemVariables'
import type { DataItemVariableResolverParser } from '../parsers/DataItemVariableResolver'

export namespace VT {
  export type Any = Record<string, ZodRawShape>

  export type FromPayload<P extends ZodRawShape> = {
    [K in keyof P]: ZodRawShape
  }

  export type Resolvers<V extends Any, Q extends ZodRawShape> = {
    [P in keyof V]: {
      [K in keyof V[P]]: input<DataItemVariableResolverParser<V[P][K], Q>>
    }
  }

  export type RuleResolvers<V extends ZodRawShape, Q extends ZodRawShape> = {
    [K in keyof V]: input<DataItemVariableResolverParser<V[K], Q>>
  }

  export type Input<
    VariableParsers extends Record<string, ZodRawShape>,
    TargetingParsers extends ZodRawShape,
    QueryParsers extends ZodRawShape,
    Name extends keyof VariableParsers,
  > = input<
    DataItemVariablesParser<
      VariableParsers[Name],
      TargetingParsers,
      QueryParsers
    >
  >
}
