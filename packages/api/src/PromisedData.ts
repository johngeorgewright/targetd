import type { $ZodShape } from 'zod/v4/core'
import type Data from './Data.ts'
import type * as DT from './types/Data.ts'
import type * as TT from './types/Targeting.ts'
import type * as FTTT from './types/FallThroughTargeting.ts'
import type * as QT from './types/Query.ts'
import type { DataItemRulesIn } from './parsers/DataItemRules.ts'

export default class PromisedData<
  PayloadParsers extends $ZodShape,
  TargetingParsers extends $ZodShape,
  QueryParsers extends $ZodShape,
  FallThroughTargetingParsers extends $ZodShape,
> implements
  PromiseLike<
    Data<
      PayloadParsers,
      TargetingParsers,
      QueryParsers,
      FallThroughTargetingParsers
    >
  > {
  #promisedData: PromiseLike<
    Data<
      PayloadParsers,
      TargetingParsers,
      QueryParsers,
      FallThroughTargetingParsers
    >
  >

  constructor(
    promisedData:
      | Data<
        PayloadParsers,
        TargetingParsers,
        QueryParsers,
        FallThroughTargetingParsers
      >
      | PromiseLike<
        Data<
          PayloadParsers,
          TargetingParsers,
          QueryParsers,
          FallThroughTargetingParsers
        >
      >,
  ) {
    this.#promisedData = promisedData instanceof Promise
      ? promisedData
      : Promise.resolve(promisedData)
  }

  then<
    TResult1 = Data<
      PayloadParsers,
      TargetingParsers,
      QueryParsers,
      FallThroughTargetingParsers
    >,
    TResult2 = never,
  >(
    onfulfilled?:
      | ((
        value: Data<
          PayloadParsers,
          TargetingParsers,
          QueryParsers,
          FallThroughTargetingParsers
        >,
      ) => TResult1 | PromiseLike<TResult1>)
      | null
      | undefined,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | null
      | undefined,
  ): PromiseLike<TResult1 | TResult2> {
    return this.#promisedData.then(onfulfilled, onrejected)
  }

  usePayload<Parsers extends $ZodShape>(
    parsers: Parsers,
  ): PromisedData<
    PayloadParsers & Parsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  > {
    return new PromisedData(
      this.#promisedData.then((data) => data.usePayload(parsers)),
    )
  }

  insert(
    data: DT.InsertableData<
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
    return new PromisedData(this.#promisedData.then((d) => d.insert(data)))
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
    return new PromisedData(
      this.#promisedData.then((data) => data.addRules(name, rules)),
    )
  }

  useTargeting<TDs extends TT.DescriptorRecord>(
    targeting: TDs,
  ): PromisedData<
    PayloadParsers,
    TargetingParsers & TT.ParserRecord<TDs>,
    QueryParsers & QT.ParserRecord<TDs>,
    FallThroughTargetingParsers
  > {
    return new PromisedData(
      this.#promisedData.then((data) => data.useTargeting(targeting)),
    )
  }

  useFallThroughTargeting<TDs extends FTTT.DescriptorRecord>(
    targeting: TDs,
  ): PromisedData<
    PayloadParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers & FTTT.ParsersRecord<TDs>
  > {
    return new PromisedData(
      this.#promisedData.then((data) =>
        data.useFallThroughTargeting(targeting)
      ),
    )
  }
}
