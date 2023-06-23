import {
  ClientTargetingValidators,
  Data,
  DataValidators,
  QueryValidators,
  TargetingValidators,
} from '@targetd/api'
import { Payload } from '@targetd/api/dist/Data'
import { StaticRecord } from '@targetd/api/dist/types'
import fetch from 'cross-fetch'
import { z } from 'zod'

export class Client<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape,
  ClientTargetingValidators extends z.ZodRawShape
> {
  #baseURL: string

  #data: Data<
    DataValidators,
    TargetingValidators,
    QueryValidators,
    ClientTargetingValidators
  >

  #init?: RequestInit

  constructor(
    baseURL: string,
    data: Data<
      DataValidators,
      TargetingValidators,
      QueryValidators,
      ClientTargetingValidators
    >,
    init?: RequestInit
  ) {
    this.#baseURL = baseURL
    this.#data = data.removeAllRules()
    this.#init = init
  }

  async getPayload<Name extends keyof DataValidators>(
    name: Name,
    rawQuery: Partial<StaticRecord<QueryValidators>> = {}
  ): Promise<Payload<DataValidators[Name], TargetingValidators> | void> {
    const query = this.#data.QueryValidator.parse(rawQuery)
    const urlSearchParams = queryToURLSearchParams(query)
    const response = await fetch(
      `${this.#baseURL}/${String(name)}?${urlSearchParams}`,
      {
        method: 'GET',
        ...this.#init,
      }
    )
    const json = await response.json()
    return json === undefined
      ? json
      : this.#data.insert({ [name]: json } as any).getPayload(name)
  }

  async getPayloadForEachName(
    rawQuery: Partial<StaticRecord<QueryValidators>> = {}
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
  D extends Data<z.ZodRawShape, z.ZodRawShape, z.ZodRawShape, z.ZodRawShape>
> = Client<
  DataValidators<D>,
  TargetingValidators<D>,
  QueryValidators<D>,
  ClientTargetingValidators<D>
>

function queryToURLSearchParams(query: Record<string, unknown>) {
  const params: [string, string][] = []
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) for (const item of value) params.push([key, item])
    else params.push([key, String(value)])
  }
  return new URLSearchParams(params)
}
