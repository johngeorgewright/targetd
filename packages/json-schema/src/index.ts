import { DataItemParser, DataItemsParser, type DT } from '@targetd/api'
import { string } from 'zod'
import $zodToJSONSchema from 'zod-to-json-schema'

// Incorrect typing
const zodToJSONSchema =
  $zodToJSONSchema as unknown as typeof $zodToJSONSchema.default

export function dataJSONSchemas<D extends DT.Any>(data: D) {
  return zodToJSONSchema(
    DataItemsParser(
      data.payloadParsers,
      data.targetingParsers,
      data.fallThroughTargetingParsers,
    ).extend({ $schema: string().optional() }),
    {
      effectStrategy: 'input',
    },
  )
}

export function dataJSONSchema<D extends DT.Any>(
  data: D,
  name: keyof DT.PayloadParsers<D>,
) {
  return zodToJSONSchema(
    DataItemParser(
      data.payloadParsers[name],
      data.targetingParsers,
      data.fallThroughTargetingParsers,
    ).extend({ $schema: string().optional() }),
    {
      effectStrategy: 'input',
    },
  )
}
