import { DataItemParser, DataItemsParser, type DT } from '@targetd/api'
import { string } from 'zod'
import zodToJSONSchema from 'zod-to-json-schema'

export function dataJSONSchemas<D extends DT.Any>(data: D) {
  return zodToJSONSchema(
    DataItemsParser(
      data.dataParsers,
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
  name: keyof DT.DataParsers<D>,
) {
  return zodToJSONSchema(
    DataItemParser(
      data.dataParsers[name],
      data.targetingParsers,
      data.fallThroughTargetingParsers,
    ).extend({ $schema: string().optional() }),
    {
      effectStrategy: 'input',
    },
  )
}
