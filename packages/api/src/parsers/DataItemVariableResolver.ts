import {
  pipe,
  string,
  templateLiteral,
  transform,
  type ZodMiniPipe,
  type ZodMiniString,
  type ZodMiniTemplateLiteral,
  type ZodMiniTransform,
} from 'zod/mini'
import type {
  $PartsToTemplateLiteral,
  $ZodType,
  ParsePayload,
} from 'zod/v4/core'
import { objectMap } from '../util.ts'
import type { VariablesRegistry } from './variablesRegistry.ts'

export const variableStringParser = templateLiteral(['{{', string(), '}}'])
export type VariableStringParser = ZodMiniTemplateLiteral<`{{${string}}}`>

export function DataItemVariableResolverParser(
  registry: VariablesRegistry,
  parser: $ZodType,
): DataItemVariableResolverParser {
  return pipe(
    variableStringParser,
    transform((input, ctx) =>
      stringToVariableResolver(registry, parser, input, ctx)
    ),
  )
}

export function DataItemVariableResolverTransformer<T extends string>(
  registry: VariablesRegistry,
  parser: $ZodType,
  input: T,
  ctx: ParsePayload,
): T extends VariableString ? VariableResolver : T {
  return isVariableString(input)
    ? stringToVariableResolver(registry, parser, input, ctx) as any
    : input as any
}

export type DataItemVariableResolverParser = ZodMiniPipe<
  ZodMiniTemplateLiteral<
    $PartsToTemplateLiteral<
      ['{{', ZodMiniString<string>, '}}']
    >
  >,
  ZodMiniTransform<
    VariableResolver,
    `{{${string}}}`
  >
>

export interface VariableResolver {
  (variables: Record<string, any>): any
  $$resolver$$: true
}

export function isVariableResolver(x: unknown): x is VariableResolver {
  return typeof x === 'function' && '$$resolver$$' in x &&
    x.$$resolver$$ === true
}

export function resolveVariables(variables: Record<string, any>, x: unknown) {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
    ? recursivelyResolveVariables(variables, x as Record<string, unknown>)
    : resolveVariable(variables, x)
}

export function isVariableString(input: string): input is VariableString {
  return /^\{\{[^\}]+\}\}$/.test(input)
}

type VariableString = `{{${string}}}`

function resolveVariable(variables: Record<string, any>, x: unknown) {
  return isVariableResolver(x) ? x(variables) : x
}

function recursivelyResolveVariables(
  variables: Record<string, any>,
  x: Record<string, unknown>,
): Record<string, unknown> {
  return objectMap(x, (value) => resolveVariables(variables, value))
}

function stringToVariableResolver(
  registry: VariablesRegistry,
  parser: $ZodType,
  input: VariableString,
  ctx: ParsePayload,
): VariableResolver {
  const key = extractVariableName(input)
  const resolver: VariableResolver = (variables: Record<string, any>) =>
    variables[key] ?? input
  resolver.$$resolver$$ = true
  registry.set(key, {
    ctx,
    parser,
  })
  return resolver
}

function extractVariableName(input: string) {
  return input.slice(2).slice(0, -2)
}
