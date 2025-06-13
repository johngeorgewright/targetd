import type { Data } from '@targetd/api'
// @ts-types='npm:@types/express@4'
import type { RequestHandler } from 'express'
import type { $ZodShape } from 'zod/v4/core'

export function castQueryArrayProps<
  PayloadParsers extends $ZodShape,
  TargetingParsers extends $ZodShape,
  QueryParsers extends $ZodShape,
  FallThroughTargetingParsers extends $ZodShape,
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

    for (const [key, value] of Object.entries(req.query)) {
      if (
        key in queryParsers &&
        queryParsers[key]._zod.def.type === 'array' &&
        value !== undefined &&
        !Array.isArray(value)
      ) {
        req.query[key] = [value as any]
      }
    }

    next()
  }
}
