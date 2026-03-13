import { omit } from '@es-toolkit/es-toolkit'
import {
  DataItemParser,
  DataItemsParser,
  type DT,
  switchRegistry,
  type ZodSwitch,
} from '@targetd/api'
import { extend, optional, string, toJSONSchema } from 'zod/mini'
import type { $ZodType, JSONSchema } from 'zod/v4/core'

/**
 * Generate JSON Schema for all data items in a Data instance.
 * Useful for API documentation, validation, and generating client types.
 *
 * @param data - Data instance to generate schemas for.
 * @returns JSON Schema representing all data items with their rules and targeting.
 *
 * @example
 * ```ts
 * import { dataJSONSchemas } from '@targetd/json-schema'
 *
 * const schema = dataJSONSchemas(data)
 * // Write to file for documentation
 * await Deno.writeTextFile('schema.json', JSON.stringify(schema, null, 2))
 * ```
 */
export function dataJSONSchemas<D extends DT.Any>(
  data: D,
  params?: ToJSONSchemaParams,
): JSONSchema.BaseSchema {
  return toJSONSchema(
    extend(
      DataItemsParser(
        data.payloadParsers,
        data.targetingParsers,
        data.fallThroughTargetingParsers,
      ) as any,
      { $schema: optional(string()) },
    ),
    toJSONSchemaParams(params),
  )
}

/**
 * Generate JSON Schema for a specific data item by name.
 *
 * @param data - Data instance containing the item.
 * @param name - Name of the payload to generate schema for.
 * @returns JSON Schema representing the specific data item with its rules and targeting.
 *
 * @example
 * ```ts
 * import { dataJSONSchema } from '@targetd/json-schema'
 *
 * const greetingSchema = dataJSONSchema(data, 'greeting')
 * console.log(greetingSchema)
 * ```
 */
export function dataJSONSchema<D extends DT.Any>(
  data: D,
  name: keyof DT.PayloadParsers<D>,
  params?: ToJSONSchemaParams,
): JSONSchema.BaseSchema {
  return toJSONSchema(
    extend(
      DataItemParser(
        data.payloadParsers[name],
        data.targetingParsers,
        data.fallThroughTargetingParsers,
        true,
      ) as any,
      { $schema: optional(string()) },
    ),
    toJSONSchemaParams(params),
  )
}

type _ToJSONSchemaParams = NonNullable<Parameters<typeof toJSONSchema>[1]>

export type ToJSONSchemaParams = _ToJSONSchemaParams & {
  override?: (
    ...args: Parameters<Required<_ToJSONSchemaParams>['override']>
  ) => void | boolean
}

function toJSONSchemaParams(params?: ToJSONSchemaParams): _ToJSONSchemaParams {
  return {
    io: 'input',
    reused: 'ref',
    unrepresentable: 'any',
    override(ctx) {
      if (params?.override?.(ctx)) return
      if (isZodSwitch(ctx.zodSchema)) {
        const union = switchRegistry.get(ctx.zodSchema)
          ?.union
        if (union) {
          const schema = toJSONSchema(
            union as any,
            toJSONSchemaParams(params),
          )
          // Mutate the jsonSchema in place - ctx.jsonSchema is a reference
          // to the actual schema object, so we must modify it directly
          for (const key in ctx.jsonSchema) {
            delete (ctx.jsonSchema as Record<string, unknown>)[key]
          }
          Object.assign(ctx.jsonSchema, schema)
          delete (ctx.jsonSchema as Record<string, unknown>).$schema
        }
      }
    },
    ...(params && omit(params, ['override'])),
  }
}

function isZodSwitch(parser: $ZodType): parser is ZodSwitch {
  return parser._zod.def.type === 'custom' &&
    switchRegistry.has(parser as ZodSwitch)
}
