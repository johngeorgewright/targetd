import type { $ZodShape } from 'zod/v4/core'
import type Data from './Data.ts'
import type * as DT from './types/Data.ts'
import type * as TT from './types/Targeting.ts'
import type * as FTTT from './types/FallThroughTargeting.ts'
import type * as QT from './types/Query.ts'
import type { DataItemRulesIn } from './parsers/DataItemRules.ts'
import type { MaybePromise } from './types.ts'

export default class PromisedData<
  PayloadParsers extends $ZodShape,
  TargetingParsers extends $ZodShape,
  QueryParsers extends $ZodShape,
  FallThroughTargetingParsers extends $ZodShape,
> extends Promise<
  Data<
    PayloadParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  >
> {
  constructor(
    executor: (
      resolve: (
        value: MaybePromise<
          Data<
            PayloadParsers,
            TargetingParsers,
            QueryParsers,
            FallThroughTargetingParsers
          >
        >,
      ) => void,
      reject: (reason?: any) => void,
    ) => void,
  ) {
    super(executor)
  }

  static create<
    PayloadParsers extends $ZodShape,
    TargetingParsers extends $ZodShape,
    QueryParsers extends $ZodShape,
    FallThroughTargetingParsers extends $ZodShape,
  >(
    promisedData: MaybePromise<
      Data<
        PayloadParsers,
        TargetingParsers,
        QueryParsers,
        FallThroughTargetingParsers
      >
    >,
  ): PromisedData<
    PayloadParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  > {
    return new PromisedData((resolve) => resolve(promisedData))
  }

  #create<
    NewPayloadParsers extends $ZodShape,
    NewTargetingParsers extends $ZodShape,
    NewQueryParsers extends $ZodShape,
    NewFallThroughTargetingParsers extends $ZodShape,
  >(
    cb: (
      data: Data<
        PayloadParsers,
        TargetingParsers,
        QueryParsers,
        FallThroughTargetingParsers
      >,
    ) => MaybePromise<
      Data<
        NewPayloadParsers,
        NewTargetingParsers,
        NewQueryParsers,
        NewFallThroughTargetingParsers
      >
    >,
  ): PromisedData<
    NewPayloadParsers,
    NewTargetingParsers,
    NewQueryParsers,
    NewFallThroughTargetingParsers
  > {
    return new PromisedData((resolve) => resolve(this.then(cb)))
  }

  usePayload<Parsers extends $ZodShape>(
    parsers: Parsers,
  ): PromisedData<
    PayloadParsers & Parsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  > {
    return this.#create((data) => data.usePayload(parsers))
  }

  insert(
    insertableData: DT.InsertableData<
      PayloadParsers,
      TargetingParsers,
      FallThroughTargetingParsers
    >,
  ): PromisedData<
    PayloadParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  > {
    return this.#create((data) => data.insert(insertableData))
  }

  addRules<
    Name extends keyof PayloadParsers,
  >(
    name: Name,
    rules: DataItemRulesIn<
      PayloadParsers[Name],
      TargetingParsers,
      FallThroughTargetingParsers
    >,
  ): PromisedData<
    PayloadParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  > {
    return this.#create((data) => data.addRules(name, rules))
  }

  useTargeting<TDs extends TT.DescriptorRecord>(
    targeting: TDs,
  ): PromisedData<
    PayloadParsers,
    TargetingParsers & TT.ParserRecord<TDs>,
    QueryParsers & QT.ParserRecord<TDs>,
    FallThroughTargetingParsers
  > {
    return this.#create((data) => data.useTargeting(targeting))
  }

  useFallThroughTargeting<TDs extends FTTT.DescriptorRecord>(
    targeting: TDs,
  ): PromisedData<
    PayloadParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers & FTTT.ParsersRecord<TDs>
  > {
    return this.#create((data) => data.useFallThroughTargeting(targeting))
  }
}
