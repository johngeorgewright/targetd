import type { Data } from '@targetd/api'
import type { RequestHandler } from 'express'
import type { $ZodShape } from 'zod/v4/core'
import type { MaybePromise } from '../types.ts'

export function castQueryArrayProps<
  PayloadParsers extends $ZodShape,
  TargetingParsers extends $ZodShape,
  QueryParsers extends $ZodShape,
  FallThroughTargetingParsers extends $ZodShape,
>(
  getData: () => MaybePromise<
    Data<
      PayloadParsers,
      TargetingParsers,
      QueryParsers,
      FallThroughTargetingParsers
    >
  >,
): RequestHandler {
  return async (req, res, next) => {
    const { queryParsers } = await getData()

    for (const [key, value] of Object.entries(req.query)) {
      if (
        key in queryParsers &&
        queryParsers[key]._zod.def.type === 'array' &&
        value !== undefined &&
        !Array.isArray(value)
      ) {
        res.locals.query ?? {}
        res.locals.query[key] = [value]
      }
    }

    next()
  }
}
