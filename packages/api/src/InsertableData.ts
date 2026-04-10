import type * as DT from './types/Data.ts'

/**
 * Interface for inserting rule data into a {@link Data} instance.
 *
 * @template $ - The metadata type extending {@link DT.Meta}
 *
 * @example
 * ```ts
 * const updated = await data.insert({
 *   greeting: [{ targeting: { country: ['US'] }, payload: 'Hello!' }],
 * })
 * ```
 */
export interface InsertableData<$ extends DT.Meta> {
  /**
   * Insert rule data into the instance.
   *
   * @param data - The data to insert, keyed by payload name.
   * @returns A new instance with the inserted data.
   */
  insert(data: DT.InsertableData<$>): Promise<InsertableData<$>>
}
