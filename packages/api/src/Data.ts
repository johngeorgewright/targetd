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
import type { MaybePromise, StaticRecord, ZodPartialObject } from './types'
import { DataItemRulesParser } from './parsers/DataItemRules'
import type { DT } from './types/Data'
import type { TT } from './types/Targeting'
import type { FTTT } from './types/FallThroughTargeting'
import type { PT } from './types/Payload'
import type { QT } from './types/Query'
import type { VT } from './types/Variables'
import { DataItemVariableResolverParser } from './parsers/DataItemVariableResolver'

export default class Data<
  PayloadParsers extends ZodRawShape,
  TargetingParsers extends ZodRawShape,
  QueryParsers extends ZodRawShape,
  FallThroughTargetingParsers extends ZodRawShape,
  VariableParsers extends VT.FromPayload<PayloadParsers>,
> {
  readonly #fallThroughTargetingParsers: FallThroughTargetingParsers
  readonly #data: Partial<
    zInfer<
      DataItemsParser<
        PayloadParsers,
        TargetingParsers,
        FallThroughTargetingParsers,
        QueryParsers,
        VariableParsers
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
  readonly #variableParsers: VariableParsers

  static create(): Data<{}, {}, {}, {}, {}>

  static create<Options extends DT.CreateOptions>(
    options: Options,
  ): DT.FromCreateOptions<Options>

  static create(options: DT.CreateOptions = {}) {
    const data = new Data({}, {}, {}, {}, {}, {}, {}) as DT.Any
    const payloadParsers = options.payload
      ? data.#mergePayloadParsers(options.payload)
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
    const variableParsers = objectMap(payloadParsers, () => ({}))
    return new Data(
      data.#data,
      payloadParsers,
      targetingPredicates,
      targetingParsers,
      queryParsers,
      fallThroughTargeting,
      variableParsers,
    )
  }

  private constructor(
    data: Partial<
      zInfer<
        DataItemsParser<
          PayloadParsers,
          TargetingParsers,
          FallThroughTargetingParsers,
          QueryParsers,
          VariableParsers
        >
      >
    >,
    payloadParsers: PayloadParsers,
    targetingPredicates: TargetingPredicates<TargetingParsers, QueryParsers>,
    targetingParsers: TargetingParsers,
    queryParsers: QueryParsers,
    fallThroughTargetingParsers: FallThroughTargetingParsers,
    variableParsers: VariableParsers,
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
    this.#variableParsers = variableParsers
  }

  get data(): Partial<
    zInfer<
      DataItemsParser<
        PayloadParsers,
        TargetingParsers,
        FallThroughTargetingParsers,
        QueryParsers,
        VariableParsers
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
      FallThroughTargetingParsers,
      VT.FromPayload<PayloadParsers & Parsers>
    >
  > {
    type NewPayloadParsers = PayloadParsers & Parsers

    const payloadParsers = this.#mergePayloadParsers(parsers)

    const variableParsers = this.#variableParsers as VT.FromPayload<
      PayloadParsers & Parsers
    >

    const data = (await DataItemsParser(
      payloadParsers,
      this.#targetingParsers,
      this.#fallThroughTargetingParsers,
      this.#queryParsers,
      variableParsers,
    ).parseAsync(this.#data)) as zInfer<
      DataItemsParser<
        NewPayloadParsers,
        TargetingParsers,
        FallThroughTargetingParsers,
        QueryParsers,
        VT.FromPayload<PayloadParsers & Parsers>
      >
    >

    return new Data<
      NewPayloadParsers,
      TargetingParsers,
      QueryParsers,
      FallThroughTargetingParsers,
      VT.FromPayload<PayloadParsers & Parsers>
    >(
      data,
      payloadParsers,
      this.#targetingPredicates,
      this.#targetingParsers,
      this.#queryParsers,
      this.#fallThroughTargetingParsers,
      variableParsers,
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
      FallThroughTargetingParsers,
      QueryParsers
    >,
  ) {
    let result: Data<
      PayloadParsers,
      TargetingParsers,
      QueryParsers,
      FallThroughTargetingParsers,
      VariableParsers
    > = this

    for (const [key, value] of objectIterator(data)) {
      result = await result.addRules(
        key as keyof PayloadParsers,
        this.#isFallThroughRulesPayload(value)
          ? value.__rules__
          : [{ payload: value }],
      )
    }

    return result
  }

  #isFallThroughRulesPayload<Name extends keyof PayloadParsers>(
    payload: PT.Payload<
      zInfer<PayloadParsers[Name]>,
      TargetingParsers,
      QueryParsers
    >,
  ): payload is FTTT.Rules<
    zInfer<PayloadParsers[Name]>,
    TargetingParsers,
    QueryParsers
  > {
    return (
      typeof payload === 'object' && payload !== null && '__rules__' in payload
    )
  }

  async addRules<Name extends keyof PayloadParsers>(
    name: Name,
    opts:
      | input<
          DataItemRulesParser<
            PayloadParsers[Name],
            TargetingParsers,
            FallThroughTargetingParsers,
            QueryParsers
          >
        >
      | {
          variables: VT.Input<
            VariableParsers,
            TargetingParsers,
            QueryParsers,
            Name
          >
          rules: (
            variableResolvers: VT.RuleResolvers<
              VariableParsers[Name],
              QueryParsers
            >,
          ) => input<
            DataItemRulesParser<
              PayloadParsers[Name],
              TargetingParsers,
              FallThroughTargetingParsers,
              QueryParsers
            >
          >
        },
  ) {
    if (Array.isArray(opts)) {
      return this.#addRules(name, opts)
    } else {
      const rules = await this.#createVariableResolvingRules(name, opts)
      return this.#addRules(name, rules)
    }
  }

  async #addRules<Name extends keyof PayloadParsers>(
    name: Name,
    rules: input<
      DataItemRulesParser<
        PayloadParsers[Name],
        TargetingParsers,
        FallThroughTargetingParsers,
        QueryParsers
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
        this.#queryParsers,
        this.#variableParsers,
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
      this.#variableParsers,
    )
  }

  async #createVariableResolvingRules<Name extends keyof PayloadParsers>(
    name: Name,
    opts: {
      variables: VT.Input<VariableParsers, TargetingParsers, QueryParsers, Name>
      rules: (
        variableResolvers: VT.RuleResolvers<
          VariableParsers[Name],
          QueryParsers
        >,
      ) => input<
        DataItemRulesParser<
          PayloadParsers[Name],
          TargetingParsers,
          FallThroughTargetingParsers,
          QueryParsers
        >
      >
    },
  ) {
    const rulesVariableResolvers: VT.RuleResolvers<
      VariableParsers[Name],
      QueryParsers
    > = objectMap(opts.variables, (variableRules, variableName) => {
      const variableSchema = new Data<
        VariableParsers[Name],
        TargetingParsers,
        QueryParsers,
        {},
        VT.FromPayload<VariableParsers[Name]>
      >(
        {},
        this.#variableParsers[name],
        this.#targetingPredicates,
        this.#targetingParsers,
        this.#queryParsers,
        {},
        {} as VT.FromPayload<VariableParsers[Name]>,
      )

      const variableDataP = variableSchema.#addRules(
        variableName,
        variableRules as any,
      )

      const resolver: input<
        DataItemVariableResolverParser<
          VariableParsers[Name][typeof variableName],
          QueryParsers
        >
      > = async (query) => {
        const variableData = await variableDataP
        return variableData.getPayload(variableName, query)
      }

      return resolver
    })

    return opts.rules(rulesVariableResolvers)
  }

  removeAllRules() {
    return new Data(
      {} as any,
      this.#payloadParsers,
      this.#targetingPredicates,
      this.#targetingParsers,
      this.#queryParsers,
      this.#fallThroughTargetingParsers,
      this.#variableParsers,
    )
  }

  useVariables<Name extends keyof PayloadParsers, Vs extends ZodRawShape>(
    name: Name,
    variableParsers: Vs,
  ) {
    type NewVariableParsers = VariableParsers & { [K in Name]: Vs }

    const newVariableParsers: NewVariableParsers = {
      ...this.#variableParsers,
      [name]: variableParsers,
    }

    const data = this.#data as Partial<
      zInfer<
        DataItemsParser<
          PayloadParsers,
          TargetingParsers,
          FallThroughTargetingParsers,
          QueryParsers,
          NewVariableParsers
        >
      >
    >

    return new Data<
      PayloadParsers,
      TargetingParsers,
      QueryParsers,
      FallThroughTargetingParsers,
      NewVariableParsers
    >(
      data,
      this.#payloadParsers,
      this.#targetingPredicates,
      this.#targetingParsers,
      this.#queryParsers,
      this.#fallThroughTargetingParsers,
      newVariableParsers,
    )
  }

  async useTargeting<TDs extends TT.DescriptorRecord>(
    targeting: TDs,
  ): Promise<
    Data<
      PayloadParsers,
      TargetingParsers & TT.ParserRecord<TDs>,
      QueryParsers & QT.ParserRecord<TDs>,
      FallThroughTargetingParsers,
      VariableParsers
    >
  > {
    type NewTargetingParsers = TargetingParsers & TT.ParserRecord<TDs>

    type NewQueryParsers = QueryParsers & QT.ParserRecord<TDs>

    const targetingParsers: NewTargetingParsers =
      this.#mergeTargetingParsers(targeting)

    const targetingPredicates = this.#mergeTargetingPredicates(
      targeting,
    ) as TargetingPredicates<NewTargetingParsers, NewQueryParsers>

    const queryParsers: NewQueryParsers = this.#mergeQueryPredicates(targeting)

    const data = (await DataItemsParser(
      this.#payloadParsers,
      targetingParsers,
      this.#fallThroughTargetingParsers,
      queryParsers,
      this.#variableParsers,
    ).parseAsync(this.#data)) as zInfer<
      DataItemsParser<
        PayloadParsers,
        NewTargetingParsers,
        FallThroughTargetingParsers,
        NewQueryParsers,
        VariableParsers
      >
    >

    return new Data<
      PayloadParsers,
      NewTargetingParsers,
      NewQueryParsers,
      FallThroughTargetingParsers,
      VariableParsers
    >(
      data,
      this.#payloadParsers,
      targetingPredicates,
      targetingParsers,
      queryParsers,
      this.#fallThroughTargetingParsers,
      this.#variableParsers,
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

  #mergeTargetingPredicates(targeting: TT.DescriptorRecord) {
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
      FallThroughTargetingParsers & FTTT.ParsersRecord<TDs>,
      VariableParsers
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
      this.#queryParsers,
      this.#variableParsers,
    ).parseAsync(this.#data)) as zInfer<
      DataItemsParser<
        PayloadParsers,
        TargetingParsers,
        NewFallThroughTargetingParsers,
        QueryParsers,
        VariableParsers
      >
    >

    return new Data<
      PayloadParsers,
      TargetingParsers,
      QueryParsers,
      NewFallThroughTargetingParsers,
      VariableParsers
    >(
      data,
      this.#payloadParsers,
      this.#targetingPredicates,
      this.#targetingParsers,
      this.#queryParsers,
      fallThroughTargetingParsers,
      this.#variableParsers,
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

  async getPayloadForEachName(rawQuery: QT.Input<QueryParsers> = {}) {
    const payloads = {} as {
      [Name in keyof PayloadParsers]?:
        | PT.Payload<PayloadParsers[Name], TargetingParsers, QueryParsers>
        | undefined
    }

    await Promise.all(
      objectKeys(this.#data).map(async (name) => {
        payloads[name] = await this.getPayload(name, rawQuery)
      }),
    )

    return payloads
  }

  async getPayload<Name extends keyof PayloadParsers>(
    name: Name,
    rawQuery: QT.Input<QueryParsers> = {},
  ): Promise<PT.Payload<
    PayloadParsers[Name],
    TargetingParsers,
    QueryParsers
  > | void> {
    const predicate = await this.#createRulePredicate(rawQuery)
    for (const rule of this.#getTargetableRules(name))
      if (await predicate(rule as any)) return this.#mapRule(rule)
  }

  async getPayloads<Name extends keyof PayloadParsers>(
    name: Name,
    rawQuery: QT.Input<QueryParsers> = {},
  ): Promise<
    PT.Payload<PayloadParsers[Name], TargetingParsers, QueryParsers>[]
  > {
    const payloads: PT.Payload<
      PayloadParsers[Name],
      TargetingParsers,
      QueryParsers
    >[] = []
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
        FallThroughTargetingParsers,
        QueryParsers
      >
    >,
  ) {
    return hasPayload(rule)
      ? rule.payload
      : 'fallThrough' in rule
        ? { __rules__: rule.fallThrough }
        : undefined
  }

  #resolvePayloadVariables() {}

  async #createRulePredicate<Name extends keyof PayloadParsers>(
    rawQuery: QT.Input<QueryParsers>,
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
          FallThroughTargetingParsers,
          QueryParsers
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
              FallThroughTargetingParsers,
              QueryParsers,
              VariableParsers[Name]
            >
          >
        }
      )[name]?.rules || []
    )
  }

  async #targetingPredicate(
    query: QT.Input<QueryParsers>,
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
