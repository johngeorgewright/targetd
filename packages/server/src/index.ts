import type { DT } from '@targetd/api'
import cors from 'cors'
import express from 'express'
import { errorHandler } from './middleware/error.ts'
import { StatusError } from './StatusError.ts'
import { castQueryArrayProps } from './middleware/castQueryArrayProps.ts'
import { castQueryProp } from './middleware/castQueryProp.ts'
import type { MaybePromise } from './types.ts'

/**
 * @param pathStructure Use a path structure when you want to create a route that uses request params
 */
export function createServer<
  D extends DT.Any,
  App extends express.Express = express.Express,
>(
  data: MaybePromise<D> | (() => MaybePromise<D>),
  {
    app = express() as App,
    pathStructure,
  }: {
    app?: App
    pathStructure?: (keyof DT.QueryParsers<D>)[]
  } = {},
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
          await (await getData()).getPayloadForEachName({
            ...req.params,
            ...(res.locals.query ?? req.query),
          }),
        )
      },
    )
  }

  return server
    .get(
      '/:name',
      castQueryProp(),
      castQueryArrayProps(getData),
      async (req, res) => {
        const query = res.locals.query ?? req.query
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
            res.locals.query ?? req.query,
          ),
        )
      },
    )
    .use(errorHandler())
}
