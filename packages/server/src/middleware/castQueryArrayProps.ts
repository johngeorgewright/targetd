import { Data } from '@targetd/api'
import { RequestHandler } from 'express'
import { ZodFirstPartyTypeKind, ZodRawShape } from 'zod'

export function castQueryArrayProps<
  PayloadParsers extends ZodRawShape,
  TargetingParsers extends ZodRawShape,
  QueryParsers extends ZodRawShape,
  FallThroughTargetingParsers extends ZodRawShape,
>(
  getData: () => Data<
    PayloadParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  >,
): RequestHandler {
  return (req, _res, next) => {
    const { queryParsers } = getData()

    for (const [key, value] of Object.entries(req.query))
      if (
        key in queryParsers &&
        queryParsers[key]._def.typeName === ZodFirstPartyTypeKind.ZodArray &&
        value !== undefined &&
        !Array.isArray(value)
      )
        req.query[key] = [value as any]

    next()
  }
}
