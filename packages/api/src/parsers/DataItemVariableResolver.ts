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
import type { $PartsToTemplateLiteral } from 'zod/v4/core'
import { objectMap } from '../util.ts'

export function DataItemVariableResolverParser(): DataItemVariableResolverParser {
  return pipe(
    templateLiteral([
      '{{',
      string(),
      '}}',
    ]),
    transform(stringToVariableResolver),
  )
}

export function DataItemVariableResolverTransformer<T extends string>(
  input: T,
): T extends VariableString ? VariableResolver : T {
  return isVariableString(input)
    ? stringToVariableResolver(input) as any
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

function isVariableString(input: string): input is VariableString {
  return /^\{\{[^\}]+\}\}$/.test(input)
}

function stringToVariableResolver(input: VariableString): VariableResolver {
  const key = input.slice(2).slice(0, -2)
  const resolver: VariableResolver = (variables: Record<string, any>) =>
    variables[key] ?? input
  resolver.$$resolver$$ = true
  return resolver
}
