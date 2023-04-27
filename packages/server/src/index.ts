import { Data, zod as z } from '@targetd/api'
import cors from 'cors'
import express from 'express'
import queryTypes from 'query-types'
import { errorHandler } from './middleware/error'

export function createServer<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape
>(data: Data<DataValidators, TargetingValidators, QueryValidators>) {
  return express()
    .use(cors())

    .get('/:name', queryTypes.middleware(), async (req, res, next) => {
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
