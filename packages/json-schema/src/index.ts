import {
  DataItemParser,
  DataItemsParser,
  type DT,
  switchRegistry,
  type ZodSwitch,
} from '@targetd/api'
import { extend, optional, string, toJSONSchema, union } from 'zod/mini'
import type { $ZodType, JSONSchema } from 'zod/v4/core'

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
      ) as any,
      { $schema: optional(string()) },
    ),
    params,
  )
}

const params: NonNullable<Parameters<typeof toJSONSchema>[1]> = {
  io: 'input',
  unrepresentable: 'any',
  override(ctx) {
    if (isZodSwitch(ctx.zodSchema)) {
      const switchMap = switchRegistry.get(ctx.zodSchema)
        ?.switchMap
      if (switchMap) {
        const parsers = switchMap.map(([, parser]) => parser)
        ctx.jsonSchema = toJSONSchema(union(parsers as any), params)
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
