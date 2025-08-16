import { DataItemParser, DataItemsParser, type DT } from '@targetd/api'
import { extend, optional, string, toJSONSchema } from 'zod/mini'

export function dataJSONSchemas<D extends DT.Any>(data: D) {
  return toJSONSchema(
    extend(
      DataItemsParser(
        data.payloadParsers,
        data.targetingParsers,
        data.fallThroughTargetingParsers,
      ),
      { $schema: optional(string()) },
    ),
    {
      io: 'input',
    },
  )
}

export function dataJSONSchema<D extends DT.Any>(
  data: D,
  name: keyof DT.PayloadParsers<D>,
) {
  return toJSONSchema(
    extend(
      DataItemParser(
        data.payloadParsers[name],
        data.targetingParsers,
        data.fallThroughTargetingParsers,
      ),
      { $schema: optional(string()) },
    ),
    {
      io: 'input',
    },
  )
}
