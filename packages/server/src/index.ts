import type { Data, DataSchema, QT } from '@targetd/api'
import cors from 'cors'
import express from 'express'
import { errorHandler } from './middleware/error.ts'
import { StatusError } from './StatusError.ts'
import { castQueryArrayProps } from './middleware/castQueryArrayProps.ts'
import { castQueryProp } from './middleware/castQueryProp.ts'
import type { MaybeCallable, MaybePromise } from './types.ts'

/**
 * Configuration options for createServer.
 */
export interface CreateServerOptions<
  $ extends DataSchema = DataSchema,
  App extends express.Express = express.Express,
> {
  /**
   * Existing Express app to extend. If not provided, a new Express app is created.
   */
  app?: App
  /**
   * Array of query parameter names to use as path segments for REST-friendly URLs.
   *
   * @example
   * ```ts
   * pathStructure: ['region', 'language']
   * // Creates route: /:region/:language
   * // GET /US/en is equivalent to /?region=US&language=en
   * ```
   */
  pathStructure?: (keyof $['queryParsers'])[]
}

/**
 * Create an Express HTTP server that exposes Data targeting endpoints.
 * Provides REST API access to @targetd/api Data instances.
 *
 * @param data - Data instance or function returning Data (for dynamic data).
 * @param options - Server configuration options.
 * @param options.app - Existing Express app to extend (creates new one if not provided).
 * @param options.pathStructure - Array of query parameter names to use as path segments for REST-friendly URLs.
 * @returns Express application instance with targeting endpoints.
 *
 * @example Basic server:
 * ```ts
 * import { Data, DataSchema, targetIncludes } from '@targetd/api'
 * import { createServer } from '@targetd/server'
 * import { z } from 'zod'
 *
 * const data = await Data.create(
 *   DataSchema.create()
 *     .usePayload({ greeting: z.string() })
 *     .useTargeting({ country: targetIncludes(z.string()) }),
 * ).addRules('greeting', [
 *   { targeting: { country: ['US'] }, payload: 'Hello!' },
 *   { payload: 'Hi!' }
 * ])
 *
 * createServer(data).listen(3000)
 * // GET /greeting?country=US → "Hello!"
 * // GET / → {"greeting":"Hi!"}
 * ```
 *
 * @example With path structure:
 * ```ts
 * createServer(data, {
 *   pathStructure: ['region', 'language']
 * }).listen(3000)
 * // GET /US/en → equivalent to /?region=US&language=en
 * ```
 *
 * @example Dynamic data with hot reloading:
 * ```ts
 * let currentData = baseData
 * watch(baseData, './rules', (error, data) => {
 *   if (!error) currentData = data
 * })
 *
 * createServer(() => currentData).listen(3000)
 * ```
 */
export function createServer<
  $ extends DataSchema,
  App extends express.Express = express.Express,
>(
  data: MaybeCallable<MaybePromise<Data<$>>>,
  {
    app = express() as App,
    pathStructure,
  }: CreateServerOptions<$, App> = {},
): App {
  const getData = typeof data === 'function' ? data : () => data

  let server = app.set('query parser', 'extended').use(cors())

  if (pathStructure) {
    server = server.get(
      `/:${pathStructure.join('/:')}`,
      castQueryProp(),
      castQueryArrayProps(getData),
      async (req, res) => {
        res.json(
          await (await getData()).getPayloadForEachName(
            {
              ...req.params,
              ...(res.locals.query ?? req.query),
            } as QT.Raw<$['queryParsers']>,
          ),
        )
      },
    )
  }

  return server
    .get(
      '/:name/all',
      castQueryProp(),
      castQueryArrayProps(getData),
      async (req, res) => {
        const query = (res.locals.query ?? req.query) as QT.Raw<
          $['queryParsers']
        >
        const data = await getData()

        if (!(req.params.name in data.payloadParsers)) {
          throw new StatusError(404, `Unknown data property ${req.params.name}`)
        }

        res.json(await data.getPayloads(req.params.name, query))
      },
    )
    .get(
      '/:name',
      castQueryProp(),
      castQueryArrayProps(getData),
      async (req, res) => {
        const query = (res.locals.query ?? req.query) as QT.Raw<
          $['queryParsers']
        >
        const data = await getData()

        if (!(req.params.name in data.payloadParsers)) {
          throw new StatusError(404, `Unknown data property ${req.params.name}`)
        }

        const payload = await data.getPayload(req.params.name, query)

        if (payload === undefined) res.sendStatus(204)
        else res.json(payload)
      },
    )
    .get(
      '/',
      castQueryProp(),
      castQueryArrayProps(getData),
      async (req, res) => {
        res.json(
          await (await getData()).getPayloadForEachName(
            (res.locals.query ?? req.query) as QT.Raw<$['queryParsers']>,
          ),
        )
      },
    )
    .use(errorHandler())
}
