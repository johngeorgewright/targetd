import { Data } from '@targetd/api'
import cors from 'cors'
import express from 'express'
import queryTypes from 'query-types'
import { z } from 'zod'
import { errorHandler } from './middleware/error'
import { StatusError } from './StatusError'

export function createServer<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape
>(data: Data<DataValidators, TargetingValidators, QueryValidators>) {
  return express()
    .use(cors())

    .get('/:name', queryTypes.middleware(), async (req, res, next) => {
      if (!(req.params.name in data.dataValidators)) {
        return next(
          new StatusError(404, `Unknown data property ${req.params.name}`)
        )
      }

      let payload: any
      try {
        payload = await data.getPayload(req.params.name, req.query as any)
      } catch (err) {
        return next(err)
      }
      res.json(payload)
    })

    .get('/', queryTypes.middleware(), async (req, res, next) => {
      let payloads: Record<string, any>
      try {
        payloads = await data.getPayloadForEachName(req.query as any)
      } catch (err) {
        return next(err)
      }
      res.json(payloads)
    })

    .use(errorHandler())
}
