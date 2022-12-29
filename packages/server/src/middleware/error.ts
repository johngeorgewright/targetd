import { runtypes as rt } from '@targetd/api'
import express from 'express'

export function errorHandler(): express.ErrorRequestHandler {
  return (err, _req, res, next) => {
    if (res.headersSent) return next(err)
    res.status(
      !err ? 404 : err instanceof rt.ValidationError ? 400 : err.status || 500
    )
    res.json(err)
  }
}
