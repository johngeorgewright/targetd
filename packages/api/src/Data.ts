import {
  strictObject,
  type ZodTypeAny,
  type infer as zInfer,
  type ZodRawShape,
  type input,
  type ZodType,
} from 'zod'
import TargetingDescriptor, {
  TargetingDescriptorQueryParser,
  TargetingDescriptorTargetingParser,
  isTargetingDescriptor,
} from './parsers/TargetingDescriptor'
import type TargetingPredicates from './parsers/TargetingPredicates'
import { objectEveryAsync, objectKeys, objectMap, omit } from './util'
import { DataItemsParser } from './parsers/DataItems'
import { type DataItemParser } from './parsers/DataItem'
import type {
  DataItemRuleParser,
  RuleWithPayloadParser,
} from './parsers/DataItemRule'
import { Keys } from 'ts-toolbelt/out/Any/Keys'
import { MaybePromise, StaticRecord, ZodPartialObject } from './types'
import { DataItemRulesParser } from './parsers/DataItemRules'

export default class Data<
  DataParsers extends ZodRawShape,
  TargetingParsers extends ZodRawShape,
  QueryParsers extends ZodRawShape,
  FallThroughTargetingParsers extends ZodRawShape,
> {
  readonly #fallThroughTargetingParsers: FallThroughTargetingParsers
  readonly #data: zInfer<
    DataItemsParser<DataParsers, TargetingParsers, FallThroughTargetingParsers>
  >
  readonly #dataParsers: DataParsers
  readonly #targetingPredicates: TargetingPredicates<
    TargetingParsers,
    QueryParsers
  >
  readonly #targetingParsers: TargetingParsers
  readonly #queryParsers: QueryParsers
  readonly #QueryParser: ZodPartialObject<QueryParsers, 'strict'>

  static create() {
    return new Data({}, {}, {}, {}, {}, {})
  }

  private constructor(
    data: zInfer<
      DataItemsParser<
        DataParsers,
        TargetingParsers,
        FallThroughTargetingParsers
      >
    >,
    dataParsers: DataParsers,
    targetingPredicates: TargetingPredicates<TargetingParsers, QueryParsers>,
    targetingParsers: TargetingParsers,
    queryParsers: QueryParsers,
    fallThroughTargetingParsers: FallThroughTargetingParsers,
  ) {
    this.#fallThroughTargetingParsers = Object.freeze(
      fallThroughTargetingParsers,
    )
    this.#data = Object.freeze(data)
    this.#dataParsers = Object.freeze(dataParsers)
    this.#targetingPredicates = Object.freeze(targetingPredicates)
    this.#targetingParsers = Object.freeze(targetingParsers)
    this.#queryParsers = Object.freeze(queryParsers)
    this.#QueryParser = strictObject(this.#queryParsers).partial()
  }

  get data(): zInfer<
    DataItemsParser<DataParsers, TargetingParsers, FallThroughTargetingParsers>
  > {
    return this.#data
  }

  get dataParsers() {
    return this.#dataParsers
  }

  get targetingPredicates() {
    return this.#targetingPredicate
  }

  get targetingParsers() {
    return this.#targetingParsers
  }

  get queryParsers() {
    return this.#queryParsers
  }

  get QueryParser() {
    return this.#QueryParser
  }

  get fallThroughTargetingParsers() {
    return this.#fallThroughTargetingParsers
  }

  useData<Name extends string, Parser extends ZodTypeAny>(
    name: Name,
    parser: Parser,
  ): Data<
    DataParsers & Record<Name, Parser>,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  >

  useData<Parsers extends Record<string, ZodTypeAny>>(
    parsers: Parsers,
  ): Data<
    DataParsers & Parsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  >

  useData(nameOrParsers: any, parser?: any): any {
    return typeof nameOrParsers === 'string'
      ? this.#useDataParser(nameOrParsers, parser)
      : this.#useDataParsers(nameOrParsers)
  }

  #useDataParsers<Parsers extends Record<string, ZodTypeAny>>(
    parsers: Parsers,
  ) {
    type NewDataParsers = DataParsers & Parsers

    const dataParsers = {
      ...this.#dataParsers,
      ...parsers,
    }

    const data = DataItemsParser(
      dataParsers,
      this.#targetingParsers,
      this.#fallThroughTargetingParsers,
    ).parse(this.#data) as zInfer<
      DataItemsParser<
        NewDataParsers,
        TargetingParsers,
        FallThroughTargetingParsers
      >
    >

    return new Data<
      NewDataParsers,
      TargetingParsers,
      QueryParsers,
      FallThroughTargetingParsers
    >(
      data,
      dataParsers,
      this.#targetingPredicates,
      this.#targetingParsers,
      this.#queryParsers,
      this.#fallThroughTargetingParsers,
    )
  }

  #useDataParser<Name extends string, Parser extends ZodTypeAny>(
    name: Name,
    parser: Parser,
  ) {
    type NewDataValiators = DataParsers & Record<Name, Parser>

    const dataParsers: NewDataValiators = {
      ...this.#dataParsers,
      [name]: parser,
    }

    const data = (
      name in this.#data
        ? DataItemsParser(
            dataParsers,
            this.#targetingParsers,
            this.#fallThroughTargetingParsers,
          ).parse(this.#data)
        : this.#data
    ) as zInfer<
      DataItemsParser<
        NewDataValiators,
        TargetingParsers,
        FallThroughTargetingParsers
      >
    >

    return new Data<
      NewDataValiators,
      TargetingParsers,
      QueryParsers,
      FallThroughTargetingParsers
    >(
      data,
      dataParsers,
      this.#targetingPredicates,
      this.#targetingParsers,
      this.#queryParsers,
      this.#fallThroughTargetingParsers,
    )
  }

  insert(
    data: Partial<{
      [Name in keyof DataParsers]:
        | zInfer<DataParsers[Name]>
        | FallThroughRules<DataParsers[Name], TargetingParsers>
        | FallThroughRules<DataParsers[Name], FallThroughTargetingParsers>
    }>,
  ) {
    return Object.entries(omit(data, ['$schema'])).reduce<
      Data<
        DataParsers,
        TargetingParsers,
        QueryParsers,
        FallThroughTargetingParsers
      >
    >(
      (d, [key, value]) =>
        d.addRules(
          key as Keys<DataParsers>,
          this.#isFallThroughRulesPayload(value)
            ? value.__rules__
            : [{ payload: value } as any],
        ),
      this,
    )
  }

  #isFallThroughRulesPayload<Name extends keyof DataParsers>(
    payload: Payload<zInfer<DataParsers[Name]>, TargetingParsers>,
  ): payload is FallThroughRules<zInfer<DataParsers[Name]>, TargetingParsers> {
    return (
      typeof payload === 'object' && payload !== null && '__rules__' in payload
    )
  }

  addRules<Name extends Keys<DataParsers>>(
    name: Name,
    rules: input<
      DataItemRulesParser<
        DataParsers[Name],
        TargetingParsers,
        FallThroughTargetingParsers
      >
    >,
  ) {
    const dataItem = this.#data[name] || { rules: [] }

    const data = {
      ...this.#data,
      ...DataItemsParser(
        this.#dataParsers,
        this.#targetingParsers,
        this.#fallThroughTargetingParsers,
      ).parse({
        [name]: {
          ...dataItem,
          rules: [...dataItem.rules, ...rules],
        },
      }),
    }

    return new Data(
      data,
      this.#dataParsers,
      this.#targetingPredicates,
      this.#targetingParsers,
      this.#queryParsers,
      this.#fallThroughTargetingParsers,
    )
  }

  removeAllRules() {
    return new Data(
      {} as any,
      this.#dataParsers,
      this.#targetingPredicates,
      this.#targetingParsers,
      this.#queryParsers,
      this.#fallThroughTargetingParsers,
    )
  }

  useTargeting<
    Name extends string,
    TV extends ZodTypeAny,
    QV extends ZodTypeAny,
  >(
    name: Name,
    targetingDescriptor: TargetingDescriptor<
      TV,
      QV,
      Partial<StaticRecord<QueryParsers>>
    >,
  ): Data<
    DataParsers,
    TargetingParsers & { [K in Name]: TV },
    QueryParsers & { [K in Name]: QV },
    FallThroughTargetingParsers
  >

  useTargeting<
    TDs extends Record<
      string,
      TargetingDescriptor<any, any, Partial<StaticRecord<QueryParsers>>>
    >,
  >(
    targeting: TDs,
  ): Data<
    DataParsers,
    TargetingParsers & {
      [K in keyof TDs]: TargetingDescriptorTargetingParser<TDs[K]>
    },
    QueryParsers & {
      [K in keyof TDs]: TargetingDescriptorQueryParser<TDs[K]>
    },
    FallThroughTargetingParsers
  >

  useTargeting(nameOrTargetings: any, targetingDescriptor?: any): any {
    return typeof nameOrTargetings === 'string'
      ? this.#useTargetingDescriptor(nameOrTargetings, targetingDescriptor)
      : this.#useTargetingDescriptors(nameOrTargetings)
  }

  #useTargetingDescriptors<
    TDs extends Record<
      string,
      TargetingDescriptor<any, any, Partial<StaticRecord<QueryParsers>>>
    >,
  >(targeting: TDs) {
    type NewTargetingParsers = TargetingParsers & {
      [K in keyof TDs]: TargetingDescriptorTargetingParser<TDs[K]>
    }

    type NewQueryParsers = QueryParsers & {
      [K in keyof TDs]: TargetingDescriptorQueryParser<TDs[K]>
    }

    const targetingParsers: NewTargetingParsers = {
      ...this.targetingParsers,
      ...objectMap(targeting, ({ targetingParser }) => targetingParser),
    }

    const targetingPredicates = {
      ...this.#targetingPredicates,
      ...objectMap(targeting, (targetingDescriptor) => ({
        predicate: targetingDescriptor.predicate,
        requiresQuery:
          'requiresQuery' in targetingDescriptor
            ? targetingDescriptor.requiresQuery
            : true,
      })),
    }

    const queryParsers: NewQueryParsers = {
      ...this.#queryParsers,
      ...objectMap(targeting, ({ queryParser }) => queryParser),
    }

    const data: zInfer<
      DataItemsParser<
        DataParsers,
        NewTargetingParsers,
        FallThroughTargetingParsers
      >
    > = DataItemsParser(
      this.#dataParsers,
      targetingParsers,
      this.#fallThroughTargetingParsers,
    ).parse(this.#data)

    return new Data<
      DataParsers,
      NewTargetingParsers,
      NewQueryParsers,
      FallThroughTargetingParsers
    >(
      data,
      this.#dataParsers,
      targetingPredicates,
      targetingParsers,
      queryParsers,
      this.#fallThroughTargetingParsers,
    )
  }

  #useTargetingDescriptor<
    Name extends string,
    TV extends ZodTypeAny,
    QV extends ZodTypeAny,
  >(
    name: Name,
    targetingDescriptor: TargetingDescriptor<
      TV,
      QV,
      Partial<StaticRecord<QueryParsers>>
    >,
  ) {
    type NewTargeting = TargetingParsers & { [K in Name]: TV }
    type NewQuery = QueryParsers & { [K in Name]: QV }

    const targetingParsers: NewTargeting = {
      ...this.#targetingParsers,
      [name]: targetingDescriptor.targetingParser,
    }

    const targetingPredicates: any = {
      ...this.#targetingPredicates,
      [name]: {
        predicate: targetingDescriptor.predicate,
        requiresQuery:
          'requiresQuery' in targetingDescriptor
            ? targetingDescriptor.requiresQuery
            : true,
      },
    }

    const queryParsers: NewQuery = {
      ...this.#queryParsers,
      [name]: targetingDescriptor.queryParser,
    }

    const data: zInfer<
      DataItemsParser<DataParsers, NewTargeting, FallThroughTargetingParsers>
    > = DataItemsParser(
      this.#dataParsers,
      targetingParsers,
      this.#fallThroughTargetingParsers,
    ).parse(this.#data)

    return new Data<
      DataParsers,
      NewTargeting,
      NewQuery,
      FallThroughTargetingParsers
    >(
      data,
      this.#dataParsers,
      targetingPredicates,
      targetingParsers,
      queryParsers,
      this.#fallThroughTargetingParsers,
    )
  }

  useFallThroughTargeting<
    Name extends string,
    TV extends ZodTypeAny,
    QV extends ZodTypeAny,
  >(
    name: Name,
    targetingParser: TV | TargetingDescriptor<TV, QV>,
  ): Data<
    DataParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers & {
      [K in Name]: TV
    }
  >

  useFallThroughTargeting<
    TDs extends Record<
      string,
      TargetingDescriptor<any, any, Partial<StaticRecord<QueryParsers>>>
    >,
  >(
    targeting: TDs,
  ): Data<
    DataParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers & {
      [K in keyof TDs]: TargetingDescriptorTargetingParser<TDs[K]>
    }
  >

  useFallThroughTargeting(nameOrTargetings: any, targeting?: any): any {
    return typeof nameOrTargetings === 'string'
      ? this.#useFallThroughTargetingDescriptor(nameOrTargetings, targeting)
      : this.#useFallThroughTargetingDescriptors(nameOrTargetings)
  }

  #useFallThroughTargetingDescriptors<
    TDs extends Record<
      string,
      TargetingDescriptor<any, any, Partial<StaticRecord<QueryParsers>>>
    >,
  >(targeting: TDs) {
    type NewFallThroughTargetingParsers = FallThroughTargetingParsers & {
      [K in keyof TDs]: TargetingDescriptorTargetingParser<TDs[K]>
    }

    const fallThroughTargetingParsers: NewFallThroughTargetingParsers = {
      ...this.#fallThroughTargetingParsers,
      ...objectMap(targeting, ({ targetingParser }) => targetingParser),
    }

    const data: zInfer<
      DataItemsParser<
        DataParsers,
        TargetingParsers,
        NewFallThroughTargetingParsers
      >
    > = DataItemsParser(
      this.#dataParsers,
      this.#targetingParsers,
      fallThroughTargetingParsers,
    ).parse(this.#data)

    return new Data<
      DataParsers,
      TargetingParsers,
      QueryParsers,
      NewFallThroughTargetingParsers
    >(
      data,
      this.#dataParsers,
      this.#targetingPredicates,
      this.#targetingParsers,
      this.#queryParsers,
      fallThroughTargetingParsers,
    )
  }

  #useFallThroughTargetingDescriptor<
    Name extends string,
    TV extends ZodTypeAny,
    QV extends ZodTypeAny,
  >(name: Name, targetingParser: TV | TargetingDescriptor<TV, QV>) {
    type NewFallThroughTargeting = FallThroughTargetingParsers & {
      [K in Name]: TV
    }

    const fallThroughTargetingParsers = {
      ...this.#fallThroughTargetingParsers,
      [name]: isTargetingDescriptor(targetingParser)
        ? targetingParser.targetingParser
        : targetingParser,
    } as NewFallThroughTargeting

    const data: zInfer<
      DataItemsParser<DataParsers, TargetingParsers, NewFallThroughTargeting>
    > = DataItemsParser(
      this.#dataParsers,
      this.#targetingParsers,
      fallThroughTargetingParsers,
    ).parse(this.#data)

    return new Data<
      DataParsers,
      TargetingParsers,
      QueryParsers,
      NewFallThroughTargeting
    >(
      data,
      this.#dataParsers,
      this.#targetingPredicates,
      this.#targetingParsers,
      this.#queryParsers,
      fallThroughTargetingParsers,
    )
  }

  async getPayloadForEachName(
    rawQuery: Partial<StaticRecord<QueryParsers>> = {},
  ) {
    const payloads = {} as Partial<{
      [Name in keyof DataParsers]:
        | Payload<DataParsers[Name], TargetingParsers>
        | undefined
    }>

    await Promise.all(
      objectKeys(this.#data).map(async (name) => {
        payloads[name] = await this.getPayload(name, rawQuery)
      }),
    )

    return payloads
  }

  async getPayload<Name extends keyof DataParsers>(
    name: Name,
    rawQuery: Partial<StaticRecord<QueryParsers>> = {},
  ): Promise<Payload<DataParsers[Name], TargetingParsers> | void> {
    const predicate = this.#createRulePredicate(rawQuery)
    for (const rule of this.#getTargetableRules(name))
      if (await predicate(rule as any)) return this.#mapRule(rule)
  }

  async getPayloads<Name extends keyof DataParsers>(
    name: Name,
    rawQuery: Partial<StaticRecord<QueryParsers>> = {},
  ): Promise<Payload<DataParsers[Name], TargetingParsers>[]> {
    const payloads: Payload<DataParsers[Name], TargetingParsers>[] = []
    const predicate = this.#createRulePredicate(rawQuery)
    for (const rule of this.#getTargetableRules(name))
      if (await predicate(rule as any)) payloads.push(this.#mapRule(rule))
    return payloads
  }

  #mapRule<Name extends keyof DataParsers>(
    rule: zInfer<
      DataItemRuleParser<
        DataParsers[Name],
        TargetingParsers,
        FallThroughTargetingParsers
      >
    >,
  ) {
    return hasPayload(rule)
      ? rule.payload
      : 'fallThrough' in rule
        ? { __rules__: rule.fallThrough }
        : undefined
  }

  #createRulePredicate<Name extends keyof DataParsers>(
    rawQuery: Partial<StaticRecord<QueryParsers>>,
  ) {
    const query = this.#QueryParser.parse(rawQuery)

    const targeting = objectMap(
      this.#targetingPredicates,
      (target, targetingKey) => ({
        predicate: target.predicate(query[targetingKey], query as any),
        requiresQuery: target.requiresQuery,
      }),
    )

    return (
      rule: zInfer<
        DataItemRuleParser<
          DataParsers[Name],
          TargetingParsers,
          FallThroughTargetingParsers
        >
      >,
    ) =>
      !('targeting' in rule) ||
      this.#targetingPredicate(query, rule.targeting!, targeting)
  }

  #getTargetableRules<Name extends keyof DataParsers>(name: Name) {
    return (
      (
        this.#data as unknown as {
          [Name in keyof DataParsers]: zInfer<
            DataItemParser<
              DataParsers[Name],
              TargetingParsers,
              FallThroughTargetingParsers
            >
          >
        }
      )[name]?.rules || []
    )
  }

  async #targetingPredicate(
    query: Partial<StaticRecord<QueryParsers>>,
    targeting:
      | Partial<StaticRecord<TargetingParsers>>
      | Partial<StaticRecord<TargetingParsers>>[],
    predicates: Record<
      any,
      {
        predicate: MaybePromise<(targeting: unknown) => MaybePromise<boolean>>
        requiresQuery: boolean
      }
    >,
  ) {
    const targetings = Array.isArray(targeting) ? targeting : [targeting]
    for (const targeting of targetings)
      if (
        await objectEveryAsync(
          targeting,
          async (targetingValue, targetingKey) => {
            if (
              !(targetingKey in query) &&
              predicates[targetingKey]?.requiresQuery
            )
              return false

            if (targetingKey in predicates)
              return (await predicates[targetingKey].predicate)(targetingValue)
            else
              console.warn(`Invalid targeting property ${String(targetingKey)}`)

            return false
          },
        )
      )
        return true
    return false
  }
}

function hasPayload<Payload>(x: any): x is { payload: Payload } {
  return 'payload' in x
}

export type FallThroughRules<P extends ZodTypeAny, T extends ZodRawShape> = {
  __rules__: zInfer<RuleWithPayloadParser<P, T>>[]
}

export type Payload<P extends ZodTypeAny, T extends ZodRawShape> =
  | zInfer<P>
  | FallThroughRules<P, T>

export type DataParsers<
  D extends Data<ZodRawShape, ZodRawShape, ZodRawShape, ZodRawShape>,
> = D extends Data<infer V, ZodRawShape, ZodRawShape, ZodRawShape> ? V : never

export type TargetingParsers<
  D extends Data<ZodRawShape, ZodRawShape, ZodRawShape, ZodRawShape>,
> = D extends Data<ZodRawShape, infer V, ZodRawShape, ZodRawShape> ? V : never

export type QueryParsers<
  D extends Data<ZodRawShape, ZodRawShape, ZodRawShape, ZodRawShape>,
> = D extends Data<ZodRawShape, ZodRawShape, infer V, ZodRawShape> ? V : never

export type FallThroughTargetingParsers<
  D extends Data<ZodRawShape, ZodRawShape, ZodRawShape, ZodRawShape>,
> = D extends Data<ZodRawShape, ZodRawShape, ZodRawShape, infer V> ? V : never

export type FallThroughData<
  D extends Data<ZodRawShape, ZodRawShape, ZodRawShape, ZodRawShape>,
> = Data<
  DataParsers<D>,
  { [K in keyof FallThroughTargetingParsers<D>]: ZodType },
  Omit<QueryParsers<D>, keyof TargetingParsers<D>>,
  {}
>
