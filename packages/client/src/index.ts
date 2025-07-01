import type { Data, DT, PT, StaticRecord } from '@targetd/api'
import type { $ZodShape } from 'zod/v4/core'
import { queryToURLSearchParams } from './queryToURLSearchParams.ts'

export class Client<
  PayloadParsers extends $ZodShape,
  TargetingParsers extends $ZodShape,
  QueryParsers extends $ZodShape,
  FallThroughTargetingParsers extends $ZodShape,
> {
  #baseURL: string

  #data: Data<
    PayloadParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  >

  #init?: RequestInit

  constructor(
    baseURL: string,
    data: Data<
      PayloadParsers,
      TargetingParsers,
      QueryParsers,
      FallThroughTargetingParsers
    >,
    init?: RequestInit,
  ) {
    this.#baseURL = baseURL
    this.#data = data.removeAllRules()
    this.#init = init
  }

  async getPayload<Name extends keyof PayloadParsers>(
    name: Name,
    rawQuery: Partial<StaticRecord<QueryParsers>> = {},
  ): Promise<
    PT.Payload<PayloadParsers[Name], FallThroughTargetingParsers> | void
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
    if (response.status === 204) return undefined
    else {
      const data = await this.#data.insert({
        [name]: await response.json(),
      } as any)
      return data.getPayload(name)
    }
  }

  async getPayloadForEachName(
    rawQuery: Partial<StaticRecord<QueryParsers>> = {},
  ): Promise<
    Partial<
      {
        [Name in keyof PayloadParsers]:
          | PT.Payload<PayloadParsers[Name], FallThroughTargetingParsers>
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

export type ClientWithData<
  D extends DT.Any,
> = Client<
  DT.PayloadParsers<D>,
  DT.TargetingParsers<D>,
  DT.QueryParsers<D>,
  DT.FallThroughTargetingParsers<D>
>
