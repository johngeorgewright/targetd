import {
  strictObject,
  type ZodTypeAny,
  type infer as zInfer,
  type ZodRawShape,
  type input,
  ZodType,
} from 'zod'
import TargetingDescriptor, {
  TargetingDescriptorQueryParser,
  TargetingDescriptorTargetingParser,
} from './parsers/TargetingDescriptor'
import type TargetingPredicates from './parsers/TargetingPredicates'
import { objectEveryAsync, objectIterator, objectKeys, objectMap } from './util'
import { DataItemsParser } from './parsers/DataItems'
import { type DataItemParser } from './parsers/DataItem'
import type {
  DataItemRuleParser,
  RuleWithPayloadParser,
} from './parsers/DataItemRule'
import { Keys } from 'ts-toolbelt/out/Any/Keys'
import { MaybePromise, StaticRecord, ZodPartialObject } from './types'
import { DataItemRulesParser } from './parsers/DataItemRules'

interface CreateOptions {
  data?: ZodRawShape
  targeting?: Record<string, TargetingDescriptor<any, any, any>>
  fallThroughTargeting?: Record<
    string,
    ZodTypeAny | TargetingDescriptor<any, any, any>
  >
}

type DataFromCreateOptions<
  T extends CreateOptions,
  R extends Required<CreateOptions> = Required<{
    [K in keyof T]: Exclude<T[K], undefined>
  }>,
> = Data<
  R['data'],
  {
    [K in keyof R['targeting']]: TargetingDescriptorTargetingParser<
      R['targeting'][K]
    >
  },
  {
    [K in keyof R['targeting']]: TargetingDescriptorQueryParser<
      R['targeting'][K]
    >
  },
  {
    [K in keyof R['fallThroughTargeting']]: FallThroughTargetingParser<
      R['fallThroughTargeting'][K]
    >
  }
>

type FallThroughTargetingParser<
  T extends ZodTypeAny | TargetingDescriptor<any, any, any>,
> =
  T extends TargetingDescriptor<any, any, any>
    ? TargetingDescriptorTargetingParser<T>
    : T

export default class Data<
  DataParsers extends ZodRawShape,
  TargetingParsers extends ZodRawShape,
  QueryParsers extends ZodRawShape,
  FallThroughTargetingParsers extends ZodRawShape,
> {
  readonly #fallThroughTargetingParsers: FallThroughTargetingParsers
  readonly #data: Partial<
    zInfer<
      DataItemsParser<
        DataParsers,
        TargetingParsers,
        FallThroughTargetingParsers
      >
    >
  >
  readonly #dataParsers: DataParsers
  readonly #targetingPredicates: TargetingPredicates<
    TargetingParsers,
    QueryParsers
  >
  readonly #targetingParsers: TargetingParsers
  readonly #queryParsers: QueryParsers
  readonly #QueryParser: ZodPartialObject<QueryParsers, 'strict'>

  static create(): Data<{}, {}, {}, {}>

  static create<Options extends CreateOptions>(
    options: Options,
  ): DataFromCreateOptions<Options>

  static create(options: CreateOptions = {}) {
    return new Data(
      {},
      options.data || {},
      (options.targeting
        ? objectMap(options.targeting, (descriptor) => ({
            predicate: descriptor.predicate,
            requiresQuery:
              descriptor.requiresQuery === undefined
                ? true
                : descriptor.requiresQuery,
          }))
        : {}) as TargetingPredicates<any, any>,
      options.targeting
        ? objectMap(
            options.targeting,
            (descriptor) => descriptor.targetingParser,
          )
        : {},
      options.targeting
        ? objectMap(options.targeting, (descriptor) => descriptor.queryParser)
        : {},
      options.fallThroughTargeting
        ? objectMap(options.fallThroughTargeting, (x) =>
            x instanceof ZodType ? x : x.targetingParser,
          )
        : {},
    )
  }

  private constructor(
    data: Partial<
      zInfer<
        DataItemsParser<
          DataParsers,
          TargetingParsers,
          FallThroughTargetingParsers
        >
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

  get data(): Partial<
    zInfer<
      DataItemsParser<
        DataParsers,
        TargetingParsers,
        FallThroughTargetingParsers
      >
    >
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

  async useData<Parsers extends ZodRawShape>(
    parsers: Parsers,
  ): Promise<
    Data<
      DataParsers & Parsers,
      TargetingParsers,
      QueryParsers,
      FallThroughTargetingParsers
    >
  > {
    type NewDataParsers = DataParsers & Parsers

    const dataParsers = {
      ...this.#dataParsers,
      ...parsers,
    }

    const data = (await DataItemsParser(
      dataParsers,
      this.#targetingParsers,
      this.#fallThroughTargetingParsers,
    ).parseAsync(this.#data)) as zInfer<
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

  async insert(
    data: Partial<{
      [Name in keyof DataParsers]:
        | zInfer<DataParsers[Name]>
        | FallThroughRules<DataParsers[Name], TargetingParsers>
        | FallThroughRules<DataParsers[Name], FallThroughTargetingParsers>
    }>,
  ) {
    let result: Data<
      DataParsers,
      TargetingParsers,
      QueryParsers,
      FallThroughTargetingParsers
    > = this

    for (const [key, value] of objectIterator(data)) {
      result = await result.addRules(
        key as Keys<DataParsers>,
        this.#isFallThroughRulesPayload(value)
          ? value.__rules__
          : [{ payload: value }],
      )
    }

    return result
  }

  #isFallThroughRulesPayload<Name extends keyof DataParsers>(
    payload: Payload<zInfer<DataParsers[Name]>, TargetingParsers>,
  ): payload is FallThroughRules<zInfer<DataParsers[Name]>, TargetingParsers> {
    return (
      typeof payload === 'object' && payload !== null && '__rules__' in payload
    )
  }

  async addRules<Name extends Keys<DataParsers>>(
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
      ...(await DataItemsParser(
        this.#dataParsers,
        this.#targetingParsers,
        this.#fallThroughTargetingParsers,
      ).parseAsync({
        [name]: {
          ...dataItem,
          rules: [...dataItem.rules, ...rules],
        },
      })),
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

  async useTargeting<
    TDs extends Record<string, TargetingDescriptor<any, any, any>>,
  >(
    targeting: TDs,
  ): Promise<
    Data<
      DataParsers,
      TargetingParsers & {
        [K in keyof TDs]: TargetingDescriptorTargetingParser<TDs[K]>
      },
      QueryParsers & {
        [K in keyof TDs]: TargetingDescriptorQueryParser<TDs[K]>
      },
      FallThroughTargetingParsers
    >
  > {
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
    > = await DataItemsParser(
      this.#dataParsers,
      targetingParsers,
      this.#fallThroughTargetingParsers,
    ).parseAsync(this.#data)

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

  async useFallThroughTargeting<
    TDs extends Record<
      string,
      TargetingDescriptor<any, any, Partial<StaticRecord<QueryParsers>>>
    >,
  >(
    targeting: TDs,
  ): Promise<
    Data<
      DataParsers,
      TargetingParsers,
      QueryParsers,
      FallThroughTargetingParsers & {
        [K in keyof TDs]: TargetingDescriptorTargetingParser<TDs[K]>
      }
    >
  > {
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
    > = await DataItemsParser(
      this.#dataParsers,
      this.#targetingParsers,
      fallThroughTargetingParsers,
    ).parseAsync(this.#data)

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
    const predicate = await this.#createRulePredicate(rawQuery)
    for (const rule of this.#getTargetableRules(name))
      if (await predicate(rule as any)) return this.#mapRule(rule)
  }

  async getPayloads<Name extends keyof DataParsers>(
    name: Name,
    rawQuery: Partial<StaticRecord<QueryParsers>> = {},
  ): Promise<Payload<DataParsers[Name], TargetingParsers>[]> {
    const payloads: Payload<DataParsers[Name], TargetingParsers>[] = []
    const predicate = await this.#createRulePredicate(rawQuery)
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

  async #createRulePredicate<Name extends keyof DataParsers>(
    rawQuery: Partial<StaticRecord<QueryParsers>>,
  ) {
    const query = await this.#QueryParser.parseAsync(rawQuery)

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
