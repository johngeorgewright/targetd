import { omit } from 'es-toolkit'
import { DataItemParser, DataItemsParser, type DT, isZodSwitch } from '@targetd/api'
import { extend, optional, string, toJSONSchema } from 'zod/mini'
import type { JSONSchema } from 'zod/v4/core'

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

export type ToJSONSchemaParams = NonNullable<Parameters<typeof toJSONSchema>[1]>

function toJSONSchemaParams(params?: ToJSONSchemaParams): ToJSONSchemaParams {
  return {
    io: 'input',
    reused: 'ref',
    unrepresentable: 'any',
    override(ctx) {
      if (isZodSwitch(ctx.zodSchema)) {
        Object.assign(
          ctx.jsonSchema,
          toJSONSchema(ctx.zodSchema._zod.def.union, {
            ...toJSONSchemaParams(),
            reused: 'inline',
          }),
        )
        delete ctx.jsonSchema.$schema
      }
      params?.override?.(ctx)
    },
    ...(params && omit(params, ['override'])),
  }
}
