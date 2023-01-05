import express from 'express'
import z from 'zod'

export function errorHandler(): express.ErrorRequestHandler {
  return (err, _req, res, next) => {
    if (res.headersSent) return next(err)
    res.status(!err ? 404 : err instanceof z.ZodError ? 400 : err.status || 500)
    res.json(err)
  }
}
