import {
  strictObject,
  type infer as zInfer,
  type ZodRawShape,
  type input,
  ZodType,
} from 'zod'
import type TargetingPredicates from './parsers/TargetingPredicates'
import { objectEveryAsync, objectIterator, objectKeys, objectMap } from './util'
import { DataItemsParser } from './parsers/DataItems'
import type { DataItemParser } from './parsers/DataItem'
import type { DataItemRuleParser } from './parsers/DataItemRule'
import type { Keys } from 'ts-toolbelt/out/Any/Keys'
import type { MaybePromise, StaticRecord, ZodPartialObject } from './types'
import { DataItemRulesParser } from './parsers/DataItemRules'
import type { DT } from './types/Data'
import type { TT } from './types/Targeting'
import type { FTTT } from './types/FallThroughTargeting'
import type { PT } from './types/Payload'
import type { QT } from './types/Query'

export default class Data<
  PayloadParsers extends ZodRawShape,
  TargetingParsers extends ZodRawShape,
  QueryParsers extends ZodRawShape,
  FallThroughTargetingParsers extends ZodRawShape,
> {
  readonly #fallThroughTargetingParsers: FallThroughTargetingParsers
  readonly #data: Partial<
    zInfer<
      DataItemsParser<
        PayloadParsers,
        TargetingParsers,
        FallThroughTargetingParsers
      >
    >
  >
  readonly #payloadParsers: PayloadParsers
  readonly #targetingPredicates: TargetingPredicates<
    TargetingParsers,
    QueryParsers
  >
  readonly #targetingParsers: TargetingParsers
  readonly #queryParsers: QueryParsers
  readonly #QueryParser: ZodPartialObject<QueryParsers, 'strict'>

  static create(): Data<{}, {}, {}, {}>

  static create<Options extends DT.CreateOptions>(
    options: Options,
  ): DT.FromCreateOptions<Options>

  static create(options: DT.CreateOptions = {}) {
    const data = new Data({}, {}, {}, {}, {}, {})
    const payloadParsers = options.data
      ? data.#mergePayloadParsers(options.data)
      : data.#payloadParsers
    const targetingPredicates = options.targeting
      ? data.#mergeTargetingPredicates(options.targeting)
      : data.#targetingPredicates
    const targetingParsers = options.targeting
      ? data.#mergeTargetingParsers(options.targeting)
      : data.#targetingParsers
    const queryParsers = options.targeting
      ? data.#mergeQueryPredicates(options.targeting)
      : data.#queryParsers
    const fallThroughTargeting = options.fallThroughTargeting
      ? data.#mergeFallThroughTargeting(options.fallThroughTargeting)
      : data.#fallThroughTargetingParsers
    return new Data(
      data.#data,
      payloadParsers,
      targetingPredicates,
      targetingParsers,
      queryParsers,
      fallThroughTargeting,
    )
  }

  private constructor(
    data: Partial<
      zInfer<
        DataItemsParser<
          PayloadParsers,
          TargetingParsers,
          FallThroughTargetingParsers
        >
      >
    >,
    payloadParsers: PayloadParsers,
    targetingPredicates: TargetingPredicates<TargetingParsers, QueryParsers>,
    targetingParsers: TargetingParsers,
    queryParsers: QueryParsers,
    fallThroughTargetingParsers: FallThroughTargetingParsers,
  ) {
    this.#fallThroughTargetingParsers = Object.freeze(
      fallThroughTargetingParsers,
    )
    this.#data = Object.freeze(data)
    this.#payloadParsers = Object.freeze(payloadParsers)
    this.#targetingPredicates = Object.freeze(targetingPredicates)
    this.#targetingParsers = Object.freeze(targetingParsers)
    this.#queryParsers = Object.freeze(queryParsers)
    this.#QueryParser = strictObject(this.#queryParsers).partial()
  }

  get data(): Partial<
    zInfer<
      DataItemsParser<
        PayloadParsers,
        TargetingParsers,
        FallThroughTargetingParsers
      >
    >
  > {
    return this.#data
  }

  get payloadParsers() {
    return this.#payloadParsers
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

  async usePayload<Parsers extends ZodRawShape>(
    parsers: Parsers,
  ): Promise<
    Data<
      PayloadParsers & Parsers,
      TargetingParsers,
      QueryParsers,
      FallThroughTargetingParsers
    >
  > {
    type NewPayloadParsers = PayloadParsers & Parsers

    const payloadParsers = this.#mergePayloadParsers(parsers)

    const data = (await DataItemsParser(
      payloadParsers,
      this.#targetingParsers,
      this.#fallThroughTargetingParsers,
    ).parseAsync(this.#data)) as zInfer<
      DataItemsParser<
        NewPayloadParsers,
        TargetingParsers,
        FallThroughTargetingParsers
      >
    >

    return new Data<
      NewPayloadParsers,
      TargetingParsers,
      QueryParsers,
      FallThroughTargetingParsers
    >(
      data,
      payloadParsers,
      this.#targetingPredicates,
      this.#targetingParsers,
      this.#queryParsers,
      this.#fallThroughTargetingParsers,
    )
  }

  #mergePayloadParsers<Parsers extends ZodRawShape>(
    parsers: Parsers,
  ): PayloadParsers & Parsers {
    return {
      ...this.#payloadParsers,
      ...parsers,
    }
  }

  async insert(
    data: DT.InsertableData<
      PayloadParsers,
      TargetingParsers,
      FallThroughTargetingParsers
    >,
  ) {
    let result: Data<
      PayloadParsers,
      TargetingParsers,
      QueryParsers,
      FallThroughTargetingParsers
    > = this

    for (const [key, value] of objectIterator(data)) {
      result = await result.addRules(
        key as Keys<PayloadParsers>,
        this.#isFallThroughRulesPayload(value)
          ? value.__rules__
          : [{ payload: value }],
      )
    }

    return result
  }

  #isFallThroughRulesPayload<Name extends keyof PayloadParsers>(
    payload: PT.Payload<zInfer<PayloadParsers[Name]>, TargetingParsers>,
  ): payload is FTTT.Rules<zInfer<PayloadParsers[Name]>, TargetingParsers> {
    return (
      typeof payload === 'object' && payload !== null && '__rules__' in payload
    )
  }

  async addRules<Name extends Keys<PayloadParsers>>(
    name: Name,
    rules: input<
      DataItemRulesParser<
        PayloadParsers[Name],
        TargetingParsers,
        FallThroughTargetingParsers
      >
    >,
  ) {
    const dataItem = this.#data[name] || { rules: [] }

    const data = {
      ...this.#data,
      ...(await DataItemsParser(
        this.#payloadParsers,
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
      this.#payloadParsers,
      this.#targetingPredicates,
      this.#targetingParsers,
      this.#queryParsers,
      this.#fallThroughTargetingParsers,
    )
  }

  removeAllRules() {
    return new Data(
      {} as any,
      this.#payloadParsers,
      this.#targetingPredicates,
      this.#targetingParsers,
      this.#queryParsers,
      this.#fallThroughTargetingParsers,
    )
  }

  async useTargeting<TDs extends TT.DescriptorRecord>(
    targeting: TDs,
  ): Promise<
    Data<
      PayloadParsers,
      TargetingParsers & TT.ParserRecord<TDs>,
      QueryParsers & QT.ParserRecord<TDs>,
      FallThroughTargetingParsers
    >
  > {
    type NewTargetingParsers = TargetingParsers & TT.ParserRecord<TDs>

    type NewQueryParsers = QueryParsers & QT.ParserRecord<TDs>

    const targetingParsers: NewTargetingParsers =
      this.#mergeTargetingParsers(targeting)

    const targetingPredicates = this.#mergeTargetingPredicates(targeting)

    const queryParsers: NewQueryParsers = this.#mergeQueryPredicates(targeting)

    const data: zInfer<
      DataItemsParser<
        PayloadParsers,
        NewTargetingParsers,
        FallThroughTargetingParsers
      >
    > = await DataItemsParser(
      this.#payloadParsers,
      targetingParsers,
      this.#fallThroughTargetingParsers,
    ).parseAsync(this.#data)

    return new Data<
      PayloadParsers,
      NewTargetingParsers,
      NewQueryParsers,
      FallThroughTargetingParsers
    >(
      data,
      this.#payloadParsers,
      targetingPredicates,
      targetingParsers,
      queryParsers,
      this.#fallThroughTargetingParsers,
    )
  }

  #mergeTargetingParsers<TDs extends TT.DescriptorRecord>(
    targeting: TDs,
  ): TargetingParsers & TT.ParserRecord<TDs> {
    return {
      ...this.targetingParsers,
      ...objectMap(targeting, ({ targetingParser }) => targetingParser),
    }
  }

  #mergeTargetingPredicates<TDs extends TT.DescriptorRecord>(targeting: TDs) {
    return {
      ...this.#targetingPredicates,
      ...objectMap(targeting, (targetingDescriptor) => ({
        predicate: targetingDescriptor.predicate,
        requiresQuery:
          'requiresQuery' in targetingDescriptor
            ? targetingDescriptor.requiresQuery
            : true,
      })),
    }
  }

  #mergeQueryPredicates<TDs extends TT.DescriptorRecord>(
    targeting: TDs,
  ): QueryParsers & QT.ParserRecord<TDs> {
    return {
      ...this.#queryParsers,
      ...objectMap(targeting, ({ queryParser }) => queryParser),
    }
  }

  async useFallThroughTargeting<TDs extends FTTT.DescriptorRecord>(
    targeting: TDs,
  ): Promise<
    Data<
      PayloadParsers,
      TargetingParsers,
      QueryParsers,
      FallThroughTargetingParsers & FTTT.ParsersRecord<TDs>
    >
  > {
    type NewFallThroughTargetingParsers = FallThroughTargetingParsers &
      FTTT.ParsersRecord<TDs>

    const fallThroughTargetingParsers =
      this.#mergeFallThroughTargeting(targeting)

    const data = (await DataItemsParser(
      this.#payloadParsers,
      this.#targetingParsers,
      fallThroughTargetingParsers,
    ).parseAsync(this.#data)) as zInfer<
      DataItemsParser<
        PayloadParsers,
        TargetingParsers,
        NewFallThroughTargetingParsers
      >
    >

    return new Data<
      PayloadParsers,
      TargetingParsers,
      QueryParsers,
      NewFallThroughTargetingParsers
    >(
      data,
      this.#payloadParsers,
      this.#targetingPredicates,
      this.#targetingParsers,
      this.#queryParsers,
      fallThroughTargetingParsers,
    )
  }

  #mergeFallThroughTargeting<TDs extends FTTT.DescriptorRecord>(
    targeting: TDs,
  ): FallThroughTargetingParsers & FTTT.ParsersRecord<TDs> {
    return {
      ...this.#fallThroughTargetingParsers,
      ...objectMap(targeting, (descriptorOrParser) =>
        descriptorOrParser instanceof ZodType
          ? descriptorOrParser
          : descriptorOrParser.targetingParser,
      ),
    }
  }

  async getPayloadForEachName(rawQuery: QT.Raw<QueryParsers> = {}) {
    const payloads = {} as Partial<{
      [Name in keyof PayloadParsers]:
        | PT.Payload<PayloadParsers[Name], TargetingParsers>
        | undefined
    }>

    await Promise.all(
      objectKeys(this.#data).map(async (name) => {
        payloads[name] = await this.getPayload(name, rawQuery)
      }),
    )

    return payloads
  }

  async getPayload<Name extends keyof PayloadParsers>(
    name: Name,
    rawQuery: QT.Raw<QueryParsers> = {},
  ): Promise<PT.Payload<PayloadParsers[Name], TargetingParsers> | void> {
    const predicate = await this.#createRulePredicate(rawQuery)
    for (const rule of this.#getTargetableRules(name))
      if (await predicate(rule as any)) return this.#mapRule(rule)
  }

  async getPayloads<Name extends keyof PayloadParsers>(
    name: Name,
    rawQuery: QT.Raw<QueryParsers> = {},
  ): Promise<PT.Payload<PayloadParsers[Name], TargetingParsers>[]> {
    const payloads: PT.Payload<PayloadParsers[Name], TargetingParsers>[] = []
    const predicate = await this.#createRulePredicate(rawQuery)
    for (const rule of this.#getTargetableRules(name))
      if (await predicate(rule as any)) payloads.push(this.#mapRule(rule))
    return payloads
  }

  #mapRule<Name extends keyof PayloadParsers>(
    rule: zInfer<
      DataItemRuleParser<
        PayloadParsers[Name],
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

  async #createRulePredicate<Name extends keyof PayloadParsers>(
    rawQuery: QT.Raw<QueryParsers>,
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
          PayloadParsers[Name],
          TargetingParsers,
          FallThroughTargetingParsers
        >
      >,
    ) =>
      !('targeting' in rule) ||
      this.#targetingPredicate(query, rule.targeting!, targeting)
  }

  #getTargetableRules<Name extends keyof PayloadParsers>(name: Name) {
    return (
      (
        this.#data as unknown as {
          [Name in keyof PayloadParsers]: zInfer<
            DataItemParser<
              PayloadParsers[Name],
              TargetingParsers,
              FallThroughTargetingParsers
            >
          >
        }
      )[name]?.rules || []
    )
  }

  async #targetingPredicate(
    query: QT.Raw<QueryParsers>,
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
