import type * as DT from './types/Data.ts'
import type * as PT from './types/Payload.ts'
import type * as QT from './types/Query.ts'

/**
 * Interface for querying payloads from a {@link Data} instance.
 *
 * @template $ - The metadata type extending {@link DT.Meta}
 *
 * @example
 * ```ts
 * const greeting = await data.getPayload('greeting', { country: 'US' })
 * const all = await data.getPayloadForEachName({ country: 'US' })
 * ```
 */
export interface QueryableData<$ extends DT.Meta> {
  /**
   * Retrieve the first matching payload for every registered payload name.
   *
   * @param rawQuery - Optional query object for targeting.
   * @returns An object mapping payload names to their matched values.
   */
  getPayloadForEachName(
    rawQuery?: QT.Raw<$['QueryParsers']>,
  ): Promise<PT.Payloads<$>>

  /**
   * Retrieve the first matching payload for a specific name.
   *
   * @param name - The payload name to look up.
   * @param rawQuery - Optional query object for targeting.
   * @returns The matched payload, or `undefined` if no rule matched.
   */
  getPayload<Name extends keyof $['PayloadParsers']>(
    name: Name,
    rawQuery?: QT.Raw<$['QueryParsers']>,
  ): Promise<
    | PT.Payload<$, $['PayloadParsers'][Name]>
    | undefined
  >

  /**
   * Retrieve all matching payloads for a specific name.
   *
   * @param name - The payload name to look up.
   * @param rawQuery - Optional query object for targeting.
   * @returns An array of all matching payloads.
   */
  getPayloads<Name extends keyof $['PayloadParsers']>(
    name: Name,
    rawQuery?: QT.Raw<$['QueryParsers']>,
  ): Promise<
    PT.Payload<$, $['PayloadParsers'][Name]>[]
  >
}
