import type { DT } from '@targetd/api'
import cors from 'cors'
import express from 'express'
import queryTypes from 'query-types'
import { errorHandler } from './middleware/error'
import { StatusError } from './StatusError'
import { castQueryArrayProps } from './middleware/castQueryArrayProps'

/**
 * @param data
 * @param pathStructure Use a path structure when you want to create a route that uses request params
 */
export function createServer<D extends DT.Any>(
  data: D | (() => D),
  pathStructure?: (keyof DT.QueryParsers<D>)[],
) {
  const getData = typeof data === 'function' ? data : () => data

  let server = express().use(cors())

  if (pathStructure) {
    server = server.get(
      `/:${pathStructure.join('/:')}`,
      queryTypes.middleware(),
      castQueryArrayProps(getData),
      async (req, res, next) => {
        let payloads: Record<string, any>
        try {
          payloads = await getData().getPayloadForEachName({
            ...req.params,
            ...req.query,
          })
        } catch (err) {
          return next(err)
        }
        res.json(payloads)
      },
    )
  }

  return server
    .get(
      '/:name',
      queryTypes.middleware(),
      castQueryArrayProps(getData),
      async (req, res, next) => {
        const data = getData()

        if (!(req.params.name in data.payloadParsers)) {
          return next(
            new StatusError(404, `Unknown data property ${req.params.name}`),
          )
        }

        let payload: any
        try {
          payload = await data.getPayload(req.params.name, req.query as any)
        } catch (err) {
          return next(err)
        }

        if (payload === undefined) res.sendStatus(204)
        else res.json(payload)
      },
    )

    .get(
      '/',
      queryTypes.middleware(),
      castQueryArrayProps(getData),
      async (req, res, next) => {
        let payloads: Record<string, any>
        try {
          payloads = await getData().getPayloadForEachName(req.query as any)
        } catch (err) {
          return next(err)
        }
        res.json(payloads)
      },
    )

    .use(errorHandler())
}
