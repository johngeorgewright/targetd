import { Data, DataItem, DataItems } from '@targetd/api'
import { z } from 'zod'
import zodToJSONSchema from 'zod-to-json-schema'

export function dataJSONSchemas<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape,
  FallThroughTargetingValidators extends z.ZodRawShape,
  StateValidators extends z.ZodRawShape,
  StateTargetingValidators extends z.ZodRawShape,
>(
  data: Data<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    FallThroughTargetingValidators,
    StateValidators,
    StateTargetingValidators
  >,
) {
  return zodToJSONSchema(
    DataItems(
      data.dataValidators,
      data.targetingValidators,
      data.fallThroughTargetingValidators,
    ).extend({ $schema: z.string().optional() }),
    {
      effectStrategy: 'input',
    },
  )
}

export function stateJSONSchemas<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape,
  FallThroughTargetingValidators extends z.ZodRawShape,
  StateValidators extends z.ZodRawShape,
  StateTargetingValidators extends z.ZodRawShape,
>(
  data: Data<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    FallThroughTargetingValidators,
    StateValidators,
    StateTargetingValidators
  >,
) {
  return zodToJSONSchema(
    DataItems(
      data.stateValidators,
      data.targetingValidators,
      data.fallThroughTargetingValidators,
    ).extend({ $schema: z.string().optional() }),
    {
      effectStrategy: 'input',
    },
  )
}

export function dataJSONSchema<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape,
  FallThroughTargetingValidators extends z.ZodRawShape,
  StateValidators extends z.ZodRawShape,
  StateTargetingValidators extends z.ZodRawShape,
>(
  data: Data<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    FallThroughTargetingValidators,
    StateValidators,
    StateTargetingValidators
  >,
  name: keyof DataValidators,
) {
  return zodToJSONSchema(
    DataItem(
      data.dataValidators[name],
      data.targetingValidators,
      data.fallThroughTargetingValidators,
    ).extend({ $schema: z.string().optional() }),
    {
      effectStrategy: 'input',
    },
  )
}

export function stateJSONSchema<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape,
  FallThroughTargetingValidators extends z.ZodRawShape,
  StateValidators extends z.ZodRawShape,
  StateTargetingValidators extends z.ZodRawShape,
>(
  data: Data<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    FallThroughTargetingValidators,
    StateValidators,
    StateTargetingValidators
  >,
  name: keyof StateValidators,
) {
  return zodToJSONSchema(
    DataItem(
      data.stateValidators[name],
      data.targetingValidators,
      data.fallThroughTargetingValidators,
    ).extend({ $schema: z.string().optional() }),
    {
      effectStrategy: 'input',
    },
  )
}
