import type { $ZodType, ParsePayload } from 'zod/v4/core'

const variablesRegistry = new WeakMap<
  $ZodType,
  VariableRegistryItems
>()

interface VariableRegistryItem {
  parser: $ZodType
  ctx: ParsePayload
}

type VariableRegistryItems = Record<string, VariableRegistryItem>

export interface VariablesRegistry {
  getAll(): VariableRegistryItems
  set(varName: string, item: VariableRegistryItem): void
}

export function variablesFor(payloadParser: $ZodType): VariablesRegistry {
  return {
    getAll: () => variablesRegistry.get(payloadParser) ?? {},
    set: (varName: string, item: VariableRegistryItem) => {
      variablesRegistry.set(payloadParser, {
        ...variablesRegistry.get(payloadParser),
        [varName]: item,
      })
    },
  }
}
