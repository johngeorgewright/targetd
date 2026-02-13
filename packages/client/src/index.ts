import type { Data, DT, PT, StaticRecord } from '@targetd/api'
import { queryToURLSearchParams } from './queryToURLSearchParams.ts'
import { ZodError } from 'zod'
import { ResponseError } from './ResponseError.ts'

/**
 * Type-safe HTTP client for querying @targetd/server instances.
 * Mirrors the Data API but makes HTTP requests instead of in-memory queries.
 *
 * @example
 * ```ts
 * import { Client } from '@targetd/client'
 * import { data } from './data.ts' // Your Data instance definition
 *
 * const client = new Client('http://localhost:3000', data)
 *
 * const greeting = await client.getPayload('greeting', { country: 'US' })
 * const allPayloads = await client.getPayloadForEachName({ country: 'US' })
 * ```
 */
export class Client<$ extends DT.Meta> {
  #baseURL: string

  #data: Data<$>

  #init?: RequestInit

  /**
   * Create a new Client instance.
   *
   * @param baseURL - The base URL of the @targetd/server instance.
   * @param data - Data instance for type definitions (rules are removed, only used for types).
   * @param init - Optional fetch RequestInit options to apply to all requests.
   *
   * @example
   * ```ts
   * const client = new Client('http://localhost:3000', data, {
   *   headers: { 'Authorization': 'Bearer token' }
   * })
   * ```
   */
  constructor(
    baseURL: string,
    data: Data<$>,
    init?: RequestInit,
  ) {
    this.#baseURL = baseURL
    this.#data = data.removeAllRules()
    this.#init = init
  }

  /**
   * Fetch a single payload from the server by name.
   *
   * @param name - The name of the payload to retrieve.
   * @param rawQuery - Optional query object with targeting parameters.
   * @returns The matched payload, undefined if no rule matched, or void if not found.
   * @throws {ZodError} When query parameters fail validation.
   * @throws {ResponseError} When the server returns an error response.
   *
   * @example
   * ```ts
   * const greeting = await client.getPayload('greeting', { country: 'US' })
   * // Returns: 'Hello!'
   *
   * const defaultGreeting = await client.getPayload('greeting')
   * // Returns: 'Hi!' (default fallback)
   * ```
   */
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

  /**
   * Fetch all payloads from the server at once.
   *
   * @param rawQuery - Optional query object with targeting parameters.
   * @returns Object mapping all payload names to their matched payloads.
   *
   * @example
   * ```ts
   * const allPayloads = await client.getPayloadForEachName({ country: 'US' })
   * // Returns: { greeting: 'Hello!', feature: {...}, ... }
   * ```
   */
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

/**
 * Helper type to create a Client from a Data instance type.
 *
 * @example
 * ```ts
 * const data = await Data.create()...
 * type MyClient = ClientWithData<typeof data>
 * ```
 */
export type ClientWithData<D extends DT.Any> = Client<DT.$<D>>
