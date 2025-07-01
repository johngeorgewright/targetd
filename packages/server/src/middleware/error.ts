// @ts-types='npm:@types/express@4'
import type express from 'express'
import { $ZodError } from 'zod/v4/core'

export function errorHandler(): express.ErrorRequestHandler {
  return (err, _req, res, next) => {
    if (res.headersSent) return next(err)
    res.status(!err ? 404 : err instanceof $ZodError ? 400 : err.status || 500)
    res.json(err)
  }
}
