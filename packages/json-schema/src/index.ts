import { Data, DataItem, DataItems } from '@targetd/api'
import { z } from 'zod'
import zodToJSONSchema from 'zod-to-json-schema'

export function dataJSONSchemas<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape
>(data: Data<DataValidators, TargetingValidators, QueryValidators>) {
  return zodToJSONSchema(
    DataItems(data.dataValidators, data.targetingValidators)
  )
}

export function dataJSONSchema<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape
>(
  data: Data<DataValidators, TargetingValidators, QueryValidators>,
  name: keyof DataValidators
) {
  return zodToJSONSchema(
    DataItem(data.dataValidators[name], data.targetingValidators)
  )
}
