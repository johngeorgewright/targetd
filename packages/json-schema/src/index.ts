import { type Data, DataItem, DataItems } from '@targetd/api'
import { type ZodRawShape, string } from 'zod'
import zodToJSONSchema from 'zod-to-json-schema'

export function dataJSONSchemas<
  DataParsers extends ZodRawShape,
  TargetingParsers extends ZodRawShape,
  QueryParsers extends ZodRawShape,
  FallThroughTargetingParsers extends ZodRawShape,
>(
  data: Data<
    DataParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  >,
) {
  return zodToJSONSchema(
    DataItems(
      data.dataParsers,
      data.targetingParsers,
      data.fallThroughTargetingParsers,
    ).extend({ $schema: string().optional() }),
    {
      effectStrategy: 'input',
    },
  )
}

export function dataJSONSchema<
  DataParsers extends ZodRawShape,
  TargetingParsers extends ZodRawShape,
  QueryParsers extends ZodRawShape,
  FallThroughTargetingParsers extends ZodRawShape,
>(
  data: Data<
    DataParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  >,
  name: keyof DataParsers,
) {
  return zodToJSONSchema(
    DataItem(
      data.dataParsers[name],
      data.targetingParsers,
      data.fallThroughTargetingParsers,
    ).extend({ $schema: string().optional() }),
    {
      effectStrategy: 'input',
    },
  )
}
