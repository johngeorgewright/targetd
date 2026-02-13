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
    params,
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
    params,
  )
}

const params: NonNullable<Parameters<typeof toJSONSchema>[1]> = {
  io: 'input',
  unrepresentable: 'any',
  reused: 'ref',
  override(ctx) {
    if (isZodSwitch(ctx.zodSchema)) {
      const union = switchRegistry.get(ctx.zodSchema)
        ?.union
      if (union) {
        ctx.jsonSchema = toJSONSchema(union as any, params)
      }
    } else if (ctx.zodSchema._zod.def.type === 'transform') {
      ctx.jsonSchema = {}
    }
  },
}

function isZodSwitch(parser: $ZodType): parser is ZodSwitch {
  return parser._zod.def.type === 'custom' &&
    switchRegistry.has(parser as ZodSwitch)
}
