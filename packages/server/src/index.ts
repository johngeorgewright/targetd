import { Data } from '@targetd/api'
import cors from 'cors'
import express from 'express'
import queryTypes from 'query-types'
import { errorHandler } from './middleware/error'

export function createServer(data: Data<any, any, any>) {
  return express()
    .use(cors())

    .get('/:name', queryTypes.middleware(), async (req, res, next) => {
      let payload: any
      try {
        payload = await data.getPayload(req.params.name, req.query)
      } catch (err) {
        return next(err)
      }
      res.json(payload)
    })

    .get('/', queryTypes.middleware(), async (req, res, next) => {
      let payloads: Record<string, any>
      try {
        payloads = await data.getPayloadForEachName(req.query)
      } catch (err) {
        return next(err)
      }
      res.json(payloads)
    })

    .use(errorHandler())
}
