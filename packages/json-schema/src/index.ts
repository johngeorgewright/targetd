import { Data, DataItem, DataItems } from '@targetd/api'
import { z } from 'zod'
import zodToJSONSchema from 'zod-to-json-schema'

export function dataJSONSchemas<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape,
  ClientTargetingValidators extends z.ZodRawShape
>(
  data: Data<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    ClientTargetingValidators
  >
) {
  return zodToJSONSchema(
    DataItems(
      data.dataValidators,
      data.targetingValidators,
      data.clientTargetingValidators
    ).extend({ $schema: z.string().optional() })
  )
}

export function dataJSONSchema<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape,
  ClientTargetingValidators extends z.ZodRawShape
>(
  data: Data<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    ClientTargetingValidators
  >,
  name: keyof DataValidators
) {
  return zodToJSONSchema(
    DataItem(
      data.dataValidators[name],
      data.targetingValidators,
      data.clientTargetingValidators
    ).extend({ $schema: z.string().optional() })
  )
}
