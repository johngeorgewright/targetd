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

export class PromisedData<$ extends DT.Meta> extends Promise<Data<$>>
  implements IData<$> {
  constructor(
    executor: (
      resolve: (value: MaybePromise<Data<$>>) => void,
      reject: (reason?: any) => void,
    ) => void,
  ) {
    super(executor)
  }

  static create<$ extends DT.Meta>(
    promisedData: MaybePromise<Data<$>>,
  ): PromisedData<$> {
    return new PromisedData((resolve) => resolve(promisedData))
  }

  #create<$$ extends DT.Meta>(
    cb: (data: Data<$>) => MaybePromise<Data<$$>>,
  ): PromisedData<$$> {
    return new PromisedData((resolve) => resolve(this.then(cb)))
  }

  usePayload<Parsers extends $ZodShape>(
    parsers: Parsers,
  ): PromisedData<
    $ & { PayloadParsers: $['PayloadParsers'] & Parsers }
  > {
    return this.#create((data) => data.usePayload(parsers))
  }

  insert(insertableData: DT.InsertableData<$>): PromisedData<$> {
    return this.#create((data) => data.insert(insertableData))
  }

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

  async getPayloadForEachName(
    rawQuery?: QT.Raw<$['QueryParsers']>,
  ): Promise<
    PT.Payloads<$>
  > {
    const data = await this
    return data.getPayloadForEachName(rawQuery)
  }

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

  async getPayloads<Name extends keyof $['PayloadParsers']>(
    name: Name,
    rawQuery?: QT.Raw<$['QueryParsers']>,
  ): Promise<
    PT.Payload<$, $['PayloadParsers'][Name]>[]
  > {
    const data = await this
    return data.getPayloads(name, rawQuery)
  }

  removeAllRules(): Promise<Data<$>> {
    return this.#create((data) => data.removeAllRules())
  }
}
