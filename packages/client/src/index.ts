import type {
  FallThroughTargetingValidators,
  Data,
  DataValidators,
  Payload,
  QueryValidators,
  StaticRecord,
  TargetingValidators,
} from '@targetd/api'
import fetch from 'cross-fetch'
import type { ZodRawShape } from 'zod'

export class Client<
  DataValidators extends ZodRawShape,
  TargetingValidators extends ZodRawShape,
  QueryValidators extends ZodRawShape,
  FallThroughTargetingValidators extends ZodRawShape,
> {
  #baseURL: string

  #data: Data<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    FallThroughTargetingValidators
  >

  #init?: RequestInit

  constructor(
    baseURL: string,
    data: Data<
      DataValidators,
      TargetingValidators,
      QueryValidators,
      FallThroughTargetingValidators
    >,
    init?: RequestInit,
  ) {
    this.#baseURL = baseURL
    this.#data = data.removeAllRules()
    this.#init = init
  }

  async getPayload<Name extends keyof DataValidators>(
    name: Name,
    rawQuery: Partial<StaticRecord<QueryValidators>> = {},
  ): Promise<Payload<DataValidators[Name], TargetingValidators> | void> {
    const query = this.#data.QueryValidator.parse(rawQuery)
    const urlSearchParams = queryToURLSearchParams(query)
    const response = await fetch(
      `${this.#baseURL}/${String(name)}?${urlSearchParams}`,
      {
        method: 'GET',
        ...this.#init,
      },
    )
    return response.status === 204
      ? undefined
      : this.#data
          .insert({ [name]: await response.json() } as any)
          .getPayload(name)
  }

  async getPayloadForEachName(
    rawQuery: Partial<StaticRecord<QueryValidators>> = {},
  ): Promise<
    Partial<{
      [Name in keyof DataValidators]:
        | Payload<DataValidators[Name], TargetingValidators>
        | undefined
    }>
  > {
    const query = this.#data.QueryValidator.parse(rawQuery)
    const urlSearchParams = queryToURLSearchParams(query)
    const response = await fetch(`${this.#baseURL}?${urlSearchParams}`, {
      method: 'GET',
      ...this.#init,
    })
    return this.#data.insert(await response.json()).getPayloadForEachName()
  }
}

export type ClientWithData<
  D extends Data<ZodRawShape, ZodRawShape, ZodRawShape, ZodRawShape>,
> = Client<
  DataValidators<D>,
  TargetingValidators<D>,
  QueryValidators<D>,
  FallThroughTargetingValidators<D>
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
