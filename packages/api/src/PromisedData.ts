import type { $ZodShape } from 'zod/v4/core'
import type Data from './Data.ts'
import type * as DT from './types/Data.ts'
import type * as PT from './types/Payload.ts'
import type * as TT from './types/Targeting.ts'
import type * as FTTT from './types/FallThroughTargeting.ts'
import type * as QT from './types/Query.ts'
import type { DataItemRulesIn } from './parsers/DataItemRules.ts'
import type { MaybePromise } from './types.ts'
import type { DataItemIn } from './parsers/DataItem.ts'
import type { IData } from './IData.ts'

/**
 * A Promise-based wrapper for Data that implements the IData interface.
 * Allows chaining operations on Data instances that may be resolved asynchronously.
 * All methods return a new PromisedData instance, enabling fluent API usage.
 *
 * This is used under the hood by {@link Data} and you most probably won't use it directly.
 *
 * @template $ - The metadata type extending Data.Meta
 * @extends {Promise<Data<$>>}
 * @implements {IData<$>}
 */
export class PromisedData<$ extends DT.Meta> extends Promise<Data<$>>
  implements IData<$> {
  /**
   * Creates a new PromisedData instance.
   *
   * @param executor - A function that receives resolve and reject callbacks
   */
  constructor(
    executor: (
      resolve: (value: MaybePromise<Data<$>>) => void,
      reject: (reason?: any) => void,
    ) => void,
  ) {
    super(executor)
  }

  /**
   * Factory method to create a PromisedData instance from a Data instance or Promise.
   *
   * @template $ - The metadata type extending Data.Meta
   * @param promisedData - A Data instance or a Promise that resolves to a Data instance
   * @returns A new PromisedData instance
   */
  static create<$ extends DT.Meta>(
    promisedData: MaybePromise<Data<$>>,
  ): PromisedData<$> {
    return new PromisedData((resolve) => resolve(promisedData))
  }

  /**
   * Internal helper method to create a new PromisedData instance by applying a transformation.
   *
   * @template $$ - The new metadata type
   * @param cb - Callback function that transforms the Data instance
   * @returns A new PromisedData instance with the transformed Data
   */
  #create<$$ extends DT.Meta>(
    cb: (data: Data<$>) => MaybePromise<Data<$$>>,
  ): PromisedData<$$> {
    return new PromisedData((resolve) => resolve(this.then(cb)))
  }

  /**
   * Registers additional payload parsers.
   *
   * @template Parsers - The Zod shape type for the parsers
   * @param parsers - An object containing Zod parsers for payload validation
   * @returns A new PromisedData instance with the updated payload parsers
   */
  usePayload<Parsers extends $ZodShape>(
    parsers: Parsers,
  ): PromisedData<
    $ & { PayloadParsers: $['PayloadParsers'] & Parsers }
  > {
    return this.#create((data) => data.usePayload(parsers))
  }

  /**
   * Inserts data items into the dataset.
   *
   * @param insertableData - The data to insert
   * @returns A new PromisedData instance with the inserted data
   */
  insert(insertableData: DT.InsertableData<$>): PromisedData<$> {
    return this.#create((data) => data.insert(insertableData))
  }

  /**
   * Adds rules for a specific payload name.
   *
   * @template Name - The name type from available payload parsers
   * @param name - The name of the payload to add rules for
   * @param opts - The data item or rules configuration to add
   * @returns A new PromisedData instance with the added rules
   */
  addRules<
    Name extends keyof $['PayloadParsers'],
  >(
    name: Name,
    opts:
      | DataItemIn<$, $['PayloadParsers'][Name]>
      | DataItemRulesIn<$, $['PayloadParsers'][Name]>,
  ): PromisedData<$> {
    return this.#create((data) => data.addRules(name, opts))
  }

  /**
   * Registers targeting descriptors to enable query-based filtering.
   *
   * @template TDs - The targeting descriptor record type
   * @param targeting - An object containing targeting descriptors
   * @returns A new PromisedData instance with the updated targeting and query parsers
   */
  useTargeting<TDs extends TT.DescriptorRecord>(
    targeting: TDs,
  ): PromisedData<
    $ & {
      TargetingParsers: $['TargetingParsers'] & TT.ParserRecord<TDs>
      QueryParsers: $['QueryParsers'] & QT.ParserRecord<TDs>
    }
  > {
    return this.#create((data) => data.useTargeting(targeting))
  }

  /**
   * Registers fall-through targeting descriptors.
   * Fall-through targeting allows rules to continue matching after a successful match.
   *
   * @template TDs - The fall-through targeting descriptor record type
   * @param targeting - An object containing fall-through targeting descriptors
   * @returns A new PromisedData instance with the updated fall-through targeting parsers
   */
  useFallThroughTargeting<TDs extends FTTT.DescriptorRecord>(
    targeting: TDs,
  ): PromisedData<
    $ & {
      FallThroughTargetingParsers:
        & $['FallThroughTargetingParsers']
        & FTTT.ParsersRecord<TDs>
    }
  > {
    return this.#create((data) => data.useFallThroughTargeting(targeting))
  }

  /**
   * Retrieves payloads for all registered payload names, optionally filtered by a query.
   *
   * @param rawQuery - Optional raw query object for filtering
   * @returns A Promise that resolves to an object containing payloads for each name
   */
  async getPayloadForEachName(
    rawQuery?: QT.Raw<$['QueryParsers']>,
  ): Promise<
    PT.Payloads<$>
  > {
    const data = await this
    return data.getPayloadForEachName(rawQuery)
  }

  /**
   * Retrieves the payload for a specific name, optionally filtered by a query.
   *
   * @template Name - The name type from available payload parsers
   * @param name - The name of the payload to retrieve
   * @param rawQuery - Optional raw query object for filtering
   * @returns A Promise that resolves to the payload or undefined if not found
   */
  async getPayload<Name extends keyof $['PayloadParsers']>(
    name: Name,
    rawQuery?: QT.Raw<$['QueryParsers']>,
  ): Promise<
    | PT.Payload<$, $['PayloadParsers'][Name]>
    | undefined
  > {
    const data = await this
    return data.getPayload(name, rawQuery)
  }

  /**
   * Retrieves all payloads for a specific name as an array, optionally filtered by a query.
   *
   * @template Name - The name type from available payload parsers
   * @param name - The name of the payloads to retrieve
   * @param rawQuery - Optional raw query object for filtering
   * @returns A Promise that resolves to an array of payloads
   */
  async getPayloads<Name extends keyof $['PayloadParsers']>(
    name: Name,
    rawQuery?: QT.Raw<$['QueryParsers']>,
  ): Promise<
    PT.Payload<$, $['PayloadParsers'][Name]>[]
  > {
    const data = await this
    return data.getPayloads(name, rawQuery)
  }

  /**
   * Removes all rules from the Data instance.
   *
   * @returns A Promise that resolves to a Data instance with all rules removed
   */
  removeAllRules(): Promise<Data<$>> {
    return this.#create((data) => data.removeAllRules())
  }
}
