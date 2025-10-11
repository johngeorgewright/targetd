import type { Data } from '@targetd/api'
import type { RequestHandler } from 'express'
import type { $ZodShape } from 'zod/v4/core'
import type { MaybePromise } from '../types.ts'
import type { ParsedQs } from './castQueryProp.ts'

export function castQueryArrayProps<
  PayloadParsers extends $ZodShape,
  TargetingParsers extends $ZodShape,
  QueryParsers extends $ZodShape,
  FallThroughTargetingParsers extends $ZodShape,
  P extends Record<string, string>,
  ResBody,
  ReqBody,
  ReqQuery,
  Locals extends { query: ParsedQs },
>(
  getData: () => MaybePromise<
    Data<
      PayloadParsers,
      TargetingParsers,
      QueryParsers,
      FallThroughTargetingParsers
    >
  >,
): RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals> {
  return async (_req, res, next) => {
    const { queryParsers } = await getData()

    for (const [key, value] of Object.entries(res.locals.query)) {
      if (
        key in queryParsers &&
        queryParsers[key]._zod.def.type === 'array' &&
        value !== undefined &&
        !Array.isArray(value)
      ) {
        res.locals.query[key] = [value]
      }
    }

    next()
  }
}
