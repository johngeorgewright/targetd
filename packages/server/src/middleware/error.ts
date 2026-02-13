import type express from 'express'
import { $ZodError } from 'zod/v4/core'

export function errorHandler(): express.ErrorRequestHandler {
  return (err, _req, res, next) => {
    if (res.headersSent) return next(err)
    if (err instanceof $ZodError) {
      res.status(400)
      res.json({
        status: 'validation error',
        issues: err.issues,
      })
      return
    }
    res.status(!err ? 404 : err.status || 500)
    res.json(err)
  }
}
