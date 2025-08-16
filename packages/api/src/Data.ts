import type TargetingPredicates from './parsers/TargetingPredicates.ts'
import {
  objectEntries,
  objectEveryAsync,
  objectKeys,
  objectMap,
  objectSize,
} from './util.ts'
import { type DataItemsOut, DataItemsParser } from './parsers/DataItems.ts'
import type { DataItemIn, DataItemOut } from './parsers/DataItem.ts'
import type { DataItemRule } from './parsers/DataItemRule.ts'
import type { MaybeArray, MaybePromise, ZodPartialObject } from './types.ts'
import type { DataItemRulesIn } from './parsers/DataItemRules.ts'
import type * as DT from './types/Data.ts'
import type * as TT from './types/Targeting.ts'
import type * as FTTT from './types/FallThroughTargeting.ts'
import type * as PT from './types/Payload.ts'
import type * as QT from './types/Query.ts'
import {
  type $InferObjectOutput,
  type $strict,
  type $ZodOptional,
  type $ZodShape,
  $ZodType,
  type output,
} from 'zod/v4/core'
import { partial, strictObject } from 'zod/mini'
import { type PromisedData, promisedData } from './PromisedData.ts'
import { resolveVariables } from './parsers/DataItemVariableResolver.ts'

/**
 * In-memory data store.
 *
 * @example
 * ```ts
 * import { z } from 'zod/mini'
 * import { targetIncludes } from '@targetd/api'
 *
 * const data = await Data.create()
 *   .usePayload({ foo: z.string() })
 *   .useTargeting({ channel: targetIncludes(z.string()) })
 *   .addRules('foo', [
 *     {
 *       targeting: { channel: ['news'] },
 *       payload: 'bar'
 *     },
 *     {
 *       payload: 'foo'
 *     }
 *   ])
 *
 * console.info(await data.getPayloadForEachName({ channel: 'news' }))
 * // { foo: 'bar' }
 * ```
 */
export default class Data<
  PayloadParsers extends $ZodShape,
  TargetingParsers extends $ZodShape,
  QueryParsers extends $ZodShape,
  FallThroughTargetingParsers extends $ZodShape,
> {
  readonly #fallThroughTargetingParsers: FallThroughTargetingParsers
  readonly #data: DataItemsOut<
    PayloadParsers,
    TargetingParsers,
    FallThroughTargetingParsers
  >
  readonly #payloadParsers: PayloadParsers
  readonly #targetingPredicates: TargetingPredicates<
    TargetingParsers,
    QueryParsers
  >
  readonly #targetingParsers: TargetingParsers
  readonly #queryParsers: QueryParsers
  readonly #QueryParser: ZodPartialObject<QueryParsers>

  static create(): PromisedData<{}, {}, {}, {}> {
    return promisedData<{}, {}, {}, {}>(new Data({}, {}, {}, {}, {}, {}))
  }

  private constructor(
    data: DataItemsOut<
      PayloadParsers,
      TargetingParsers,
      FallThroughTargetingParsers
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
    this.#QueryParser = partial(strictObject(this.#queryParsers))
  }

  get data(): DataItemsOut<
    PayloadParsers,
    TargetingParsers,
    FallThroughTargetingParsers
  > {
    return this.#data
  }

  get payloadParsers(): PayloadParsers {
    return this.#payloadParsers
  }

  get targetingPredicates(): TargetingPredicates<
    TargetingParsers,
    QueryParsers
  > {
    return this.#targetingPredicates
  }

  get targetingParsers(): TargetingParsers {
    return this.#targetingParsers
  }

  get queryParsers(): QueryParsers {
    return this.#queryParsers
  }

  get QueryParser(): ZodPartialObject<QueryParsers, $strict> {
    return this.#QueryParser
  }

  get fallThroughTargetingParsers(): FallThroughTargetingParsers {
    return this.#fallThroughTargetingParsers
  }

  async usePayload<Parsers extends $ZodShape>(
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
    ).parseAsync(this.#data)) as DataItemsOut<
      NewPayloadParsers,
      TargetingParsers,
      FallThroughTargetingParsers
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

  #mergePayloadParsers<Parsers extends $ZodShape>(
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
  ): Promise<
    Data<
      PayloadParsers,
      TargetingParsers,
      QueryParsers,
      FallThroughTargetingParsers
    >
  > {
    const newData = {
      ...this.#data,
      ...(await DataItemsParser(
        this.#payloadParsers,
        this.#targetingParsers,
        this.#fallThroughTargetingParsers,
      ).parseAsync(
        Object.entries(data).reduce((data, [name, value]) => {
          const dataItem = this.#data[name] ||
            {
              rules: [],
              variables: {},
            }
          return {
            ...data,
            [name]: {
              ...dataItem,
              rules: [
                ...dataItem.rules,
                ...this.#isFallThroughRulesPayload(value!)
                  ? value.__rules__
                  : [{ payload: value }],
              ],
              variables: dataItem.variables,
            },
          }
        }, {}),
      )),
    }

    return new Data(
      newData,
      this.#payloadParsers,
      this.#targetingPredicates,
      this.#targetingParsers,
      this.#queryParsers,
      this.#fallThroughTargetingParsers,
    )
  }

  #isFallThroughRulesPayload<Name extends keyof PayloadParsers>(
    payload: PT.Payload<
      PayloadParsers[Name],
      TargetingParsers | FallThroughTargetingParsers
    >,
  ): payload is FTTT.Rules<
    PayloadParsers[Name],
    TargetingParsers | FallThroughTargetingParsers
  > {
    return (
      typeof payload === 'object' && payload !== null && '__rules__' in payload
    )
  }

  async addRules<
    Name extends keyof PayloadParsers,
  >(
    name: Name,
    opts:
      | DataItemIn<
        PayloadParsers[Name],
        TargetingParsers,
        FallThroughTargetingParsers
      >
      | DataItemRulesIn<
        PayloadParsers[Name],
        TargetingParsers,
        FallThroughTargetingParsers
      >,
  ): Promise<
    Data<
      PayloadParsers,
      TargetingParsers,
      QueryParsers,
      FallThroughTargetingParsers
    >
  > {
    const dataItem = this.#data[name] ||
      {
        rules: [],
        variables: {},
      }

    const rules = Array.isArray(opts) ? opts : opts.rules
    const variables = Array.isArray(opts) ? {} : opts.variables

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
          variables: {
            ...dataItem.variables,
            ...variables,
          },
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

  removeAllRules(): Data<
    PayloadParsers,
    TargetingParsers,
    QueryParsers,
    FallThroughTargetingParsers
  > {
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

    const targetingParsers: NewTargetingParsers = this.#mergeTargetingParsers(
      targeting,
    )

    const targetingPredicates = this.#mergeTargetingPredicates(
      targeting,
    ) as TargetingPredicates<NewTargetingParsers, NewQueryParsers>

    const queryParsers: NewQueryParsers = this.#mergeQueryPredicates(targeting)

    const data = await DataItemsParser(
      this.#payloadParsers,
      targetingParsers,
      this.#fallThroughTargetingParsers,
    ).parseAsync(this.#data) as DataItemsOut<
      PayloadParsers,
      NewTargetingParsers,
      FallThroughTargetingParsers
    >

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

  #mergeTargetingPredicates(targeting: TT.DescriptorRecord) {
    return {
      ...this.#targetingPredicates,
      ...objectMap(targeting, (targetingDescriptor) => ({
        predicate: targetingDescriptor.predicate,
        requiresQuery: 'requiresQuery' in targetingDescriptor
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
    type NewFallThroughTargetingParsers =
      & FallThroughTargetingParsers
      & FTTT.ParsersRecord<TDs>

    const fallThroughTargetingParsers = this.#mergeFallThroughTargeting(
      targeting,
    )

    const data = (await DataItemsParser(
      this.#payloadParsers,
      this.#targetingParsers,
      fallThroughTargetingParsers,
    ).parseAsync(this.#data)) as DataItemsOut<
      PayloadParsers,
      TargetingParsers,
      NewFallThroughTargetingParsers
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
      ...objectMap(
        targeting,
        (descriptorOrParser) =>
          descriptorOrParser instanceof $ZodType
            ? descriptorOrParser
            : descriptorOrParser.targetingParser,
      ),
    }
  }

  async getPayloadForEachName(
    rawQuery: QT.Raw<QueryParsers> = {},
  ): Promise<
    PT.Payloads<PayloadParsers, FallThroughTargetingParsers>
  > {
    const payloads = {} as PT.Payloads<
      PayloadParsers,
      FallThroughTargetingParsers
    >

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
  ): Promise<
    PT.Payload<PayloadParsers[Name], FallThroughTargetingParsers> | undefined
  > {
    const predicate = await this.#createRulePredicate(rawQuery)
    const targetableItem = this.#getTargetableItem(name)
    let payload:
      | PT.Payload<PayloadParsers[Name], FallThroughTargetingParsers>
      | undefined

    for (const rule of targetableItem.rules) {
      if (await predicate(rule)) {
        payload = this.#mapRule(rule)
        break
      }
    }

    return resolveVariables(
      await this.#getVariables(targetableItem, predicate),
      payload,
    )
  }

  async #getVariables<Name extends keyof PayloadParsers>(
    targetableItem: DataItemOut<
      PayloadParsers[Name],
      TargetingParsers,
      FallThroughTargetingParsers
    >,
    predicate: (
      rule: DataItemRule<
        PayloadParsers[Name],
        TargetingParsers,
        FallThroughTargetingParsers
      >,
    ) => Promise<boolean>,
  ) {
    const variables: Record<string, any> = {}
    if (objectSize(targetableItem.variables)) {
      for (
        const [variableName, rules] of objectEntries(targetableItem.variables)
      ) {
        for (const rule of rules) {
          if (await (predicate(rule))) {
            variables[variableName] = this.#mapRule(rule)
            break
          }
        }
      }
    }
    return variables
  }

  async getPayloads<Name extends keyof PayloadParsers>(
    name: Name,
    rawQuery: QT.Raw<QueryParsers> = {},
  ): Promise<PT.Payload<PayloadParsers[Name], FallThroughTargetingParsers>[]> {
    const payloads: PT.Payload<
      PayloadParsers[Name],
      FallThroughTargetingParsers
    >[] = []
    const predicate = await this.#createRulePredicate(rawQuery)
    const targetableItem = this.#getTargetableItem(name)
    for (const rule of targetableItem.rules) {
      if (await predicate(rule as any)) {
        const mappedRule = this.#mapRule(rule)
        if (mappedRule !== undefined) {
          payloads.push(mappedRule)
        }
      }
    }
    const variables = await this.#getVariables(targetableItem, predicate)
    return payloads.map((payload) => resolveVariables(variables, payload))
  }

  #mapRule<PayloadParser extends $ZodType>(
    rule: DataItemRule<
      PayloadParser,
      TargetingParsers,
      FallThroughTargetingParsers
    >,
  ): PT.Payload<PayloadParser, FallThroughTargetingParsers> | undefined {
    return hasPayload(rule)
      ? rule.payload as output<PayloadParser>
      : 'fallThrough' in rule
      ? { __rules__: rule.fallThrough } as FTTT.Rules<
        PayloadParser,
        FallThroughTargetingParsers
      >
      : undefined
  }

  async #createRulePredicate<Name extends keyof PayloadParsers>(
    rawQuery: QT.Raw<QueryParsers>,
  ) {
    const query = await this.#QueryParser.parseAsync(rawQuery)

    return (
      rule: DataItemRule<
        PayloadParsers[Name],
        TargetingParsers,
        FallThroughTargetingParsers
      >,
    ) =>
      (
        !('targeting' in rule) ||
        this.#targetingPredicate(
          query as any,
          rule.targeting! as any,
          objectMap(
            this.#targetingPredicates,
            (target, targetingKey) => ({
              predicate: () =>
                target.predicate(
                  // We haven't yet made sure that the QueryParsers
                  // and TargetingParsers have the same keys.
                  (query as any)[targetingKey],
                  query as any,
                ),
              requiresQuery: target.requiresQuery,
            }),
          ),
        )
      ) as Promise<boolean>
  }

  #getTargetableItem<Name extends keyof PayloadParsers>(name: Name) {
    return (
      (
        this.#data as unknown as {
          [Name in keyof PayloadParsers]: DataItemOut<
            PayloadParsers[Name],
            TargetingParsers,
            FallThroughTargetingParsers
          >
        }
      )[name] ?? { rules: [], variables: {} }
    )
  }

  async #targetingPredicate(
    query: $InferObjectOutput<
      { [K in keyof QueryParsers]: $ZodOptional<QueryParsers[K]> },
      {}
    >,
    targeting: MaybeArray<
      $InferObjectOutput<
        { [K in keyof TargetingParsers]: $ZodOptional<TargetingParsers[K]> },
        {}
      >
    >,
    predicates: Record<
      keyof any,
      {
        predicate: () => MaybePromise<(targeting: any) => MaybePromise<boolean>>
        requiresQuery: boolean
      }
    >,
  ): Promise<boolean> {
    const targetings = Array.isArray(targeting) ? targeting : [targeting]
    for (const targeting of targetings) {
      if (
        await objectEveryAsync(
          targeting,
          async (targetingValue, targetingKey) => {
            if (
              !(targetingKey in query) &&
              predicates[targetingKey]?.requiresQuery
            ) {
              return false
            }

            if (targetingKey in predicates) {
              return (await predicates[targetingKey].predicate())(
                targetingValue,
              )
            } else {
              console.warn(`Invalid targeting property ${String(targetingKey)}`)
            }

            return false
          },
        )
      ) {
        return true
      }
    }
    return false
  }
}

function hasPayload<Payload>(x: any): x is { payload: Payload } {
  return 'payload' in x
}
