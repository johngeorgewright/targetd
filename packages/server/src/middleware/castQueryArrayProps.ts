import { Data } from '@targetd/api'
import { RequestHandler } from 'express'
import { ZodFirstPartyTypeKind, ZodRawShape } from 'zod'

export function castQueryArrayProps<
  DataValidators extends ZodRawShape,
  TargetingValidators extends ZodRawShape,
  QueryValidators extends ZodRawShape,
  FallThroughTargetingValidators extends ZodRawShape,
>(
  getData: () => Data<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    FallThroughTargetingValidators
  >,
): RequestHandler {
  return (req, _res, next) => {
    const { queryValidators } = getData()

    for (const [key, value] of Object.entries(req.query))
      if (
        key in queryValidators &&
        queryValidators[key]._def.typeName === ZodFirstPartyTypeKind.ZodArray &&
        value !== undefined &&
        !Array.isArray(value)
      )
        req.query[key] = [value as any]

    next()
  }
}
