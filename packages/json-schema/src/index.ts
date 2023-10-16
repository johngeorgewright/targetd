import { Data, DataItem, DataItems } from '@targetd/api'
import { z } from 'zod'
import zodToJSONSchema from 'zod-to-json-schema'

export function dataJSONSchemas<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape,
  FallThroughTargetingValidators extends z.ZodRawShape
>(
  data: Data<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    FallThroughTargetingValidators
  >
) {
  return zodToJSONSchema(
    DataItems(
      data.dataValidators,
      data.targetingValidators,
      data.fallThroughTargetingValidators
    ).extend({ $schema: z.string().optional() }),
    {
      effectStrategy: 'input',
    }
  )
}

export function dataJSONSchema<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape,
  FallThroughTargetingValidators extends z.ZodRawShape
>(
  data: Data<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    FallThroughTargetingValidators
  >,
  name: keyof DataValidators
) {
  return zodToJSONSchema(
    DataItem(
      data.dataValidators[name],
      data.targetingValidators,
      data.fallThroughTargetingValidators
    ).extend({ $schema: z.string().optional() }),
    {
      effectStrategy: 'input',
    }
  )
}
