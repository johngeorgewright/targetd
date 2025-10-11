import type { Data, DT, PT, StaticRecord } from '@targetd/api'
import { queryToURLSearchParams } from './queryToURLSearchParams.ts'
import { ZodError } from 'zod'
import { ResponseError } from './ResponseError.ts'

export class Client<$ extends DT.Meta> {
  #baseURL: string

  #data: Data<$>

  #init?: RequestInit

  constructor(
    baseURL: string,
    data: Data<$>,
    init?: RequestInit,
  ) {
    this.#baseURL = baseURL
    this.#data = data.removeAllRules()
    this.#init = init
  }

  async getPayload<Name extends keyof $['PayloadParsers']>(
    name: Name,
    rawQuery: Partial<StaticRecord<$['QueryParsers']>> = {},
  ): Promise<
    | PT.Payload<$, $['PayloadParsers'][Name]>
    | void
  > {
    const query = this.#data.QueryParser.parse(rawQuery)
    const urlSearchParams = queryToURLSearchParams(query)
    const response = await fetch(
      `${this.#baseURL}/${String(name)}?${urlSearchParams}`,
      {
        method: 'GET',
        ...this.#init,
      },
    )

    switch (true) {
      case response.status === 204:
        return undefined
      case response.status === 400:
        await response.json()
          .then(
            (error) => {
              if (error.name === '$ZodError') {
                throw new ZodError(JSON.parse(error.message))
              }
            },
            () => {},
          )
      // fallthrough
      case response.status > 200 || response.status < 200:
        throw new ResponseError(response)
      default: {
        const data = await this.#data.insert({
          [name]: await response.json(),
        } as any)
        return data.getPayload(name)
      }
    }
  }

  async getPayloadForEachName(
    rawQuery: Partial<StaticRecord<$['QueryParsers']>> = {},
  ): Promise<
    Partial<
      {
        [Name in keyof $['PayloadParsers']]:
          | PT.Payload<$, $['PayloadParsers'][Name]>
          | undefined
      }
    >
  > {
    const query = this.#data.QueryParser.parse(rawQuery)
    const urlSearchParams = queryToURLSearchParams(query)
    const response = await fetch(`${this.#baseURL}?${urlSearchParams}`, {
      method: 'GET',
      ...this.#init,
    })
    const data = await this.#data.insert((await response.json()) as any)
    return data.getPayloadForEachName()
  }
}

export type ClientWithData<D extends DT.Any> = Client<DT.$<D>>
