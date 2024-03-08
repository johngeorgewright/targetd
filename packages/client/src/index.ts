import type { Data, DT, PT, StaticRecord } from '@targetd/api'
import type { ZodRawShape } from 'zod'

export class Client<
  PayloadParsers extends ZodRawShape,
  TargetingParsers extends ZodRawShape,
  QueryParsers extends ZodRawShape,
  FallThroughTargetingParsers extends ZodRawShape,
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
  ): Promise<PT.Payload<PayloadParsers[Name], TargetingParsers> | void> {
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
    Partial<{
      [Name in keyof PayloadParsers]:
        | PT.Payload<PayloadParsers[Name], TargetingParsers>
        | undefined
    }>
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
  D extends Data<ZodRawShape, ZodRawShape, ZodRawShape, ZodRawShape>,
> = Client<
  DT.PayloadParsers<D>,
  DT.TargetingParsers<D>,
  DT.QueryParsers<D>,
  DT.FallThroughTargetingParsers<D>
>

function queryToURLSearchParams(query: Record<string, unknown>) {
  const urlSearchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(query))
    for (const [n, v] of queryValueToParams(key, value))
      urlSearchParams.append(n, v)
  return urlSearchParams
}

function* queryValueToParams(
  key: string,
  value: unknown,
): Generator<[string, string]> {
  if (Array.isArray(value))
    for (const item of value) yield* queryValueToParams(key, item)
  else if (isObject(value))
    for (const [k, v] of Object.entries(value))
      yield* queryValueToParams(`${key}[${k}]`, v)
  else yield [key, String(value)]
}

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null
}
