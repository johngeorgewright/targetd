import type { DT } from '@targetd/api'
import type { RequestHandler } from 'express'
import type { MaybePromise } from '../types.ts'
import type { ParsedQs } from './castQueryProp.ts'

/**
 * Express middleware that ensures array query parameters are actually arrays.
 * If a query parser expects an array but receives a single value, wraps it in an array.
 *
 * @param getData - Function that returns the Data instance to check query parsers.
 * @returns Express RequestHandler middleware.
 *
 * @internal
 */
export function castQueryArrayProps<
  P extends Record<string, string>,
  ResBody,
  ReqBody,
  ReqQuery,
  Locals extends { query: ParsedQs },
>(
  getData: () => MaybePromise<DT.Any>,
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
