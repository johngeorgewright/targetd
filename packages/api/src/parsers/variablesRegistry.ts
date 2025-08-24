import { type $ZodType, registry } from 'zod/v4/core'

const variablesRegistry = registry<
  { variables: Record<string, $ZodType> }
>()

export interface VariablesRegistry {
  get(): Record<string, $ZodType>
  set(varName: string, parser: $ZodType): void
}

export function variablesFor(payloadParser: $ZodType): VariablesRegistry {
  return {
    get: () =>
      (variablesRegistry.get(payloadParser)?.variables ?? {}) as Record<
        string,
        $ZodType
      >,
    set: (varName: string, parser: $ZodType) => {
      variablesRegistry.add(payloadParser, {
        variables: {
          ...variablesRegistry.get(payloadParser)?.variables,
          [varName]: parser as any,
        },
      })
    },
  }
}
