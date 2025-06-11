// @ts-types='npm:@types/express@4'
import type { RequestHandler } from 'express'

declare module 'query-types' {
  export function middleware(): RequestHandler
}
