import type TargetingPredicates from './parsers/TargetingPredicates.ts'
import {
  objectEntries,
  objectEveryAsync,
  objectFitler,
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
import { PromisedData } from './PromisedData.ts'
import { resolveVariables } from './parsers/DataItemVariableResolver.ts'
import type { IData } from './IData.ts'

/**
 * In-memory data store.
 *
 * @example
 * ```ts
 * import { z } from 'zod/mini'
 * import { targetIncludes } from '@targetd/api'
 * import { assertEquals } from 'jsr:@std/assert'
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
 * assertEquals(
 *   await data.getPayloadForEachName({ channel: 'news' }),
 *   { foo: 'bar' },
 * )
 * ```
 */
export default class Data<$ extends DT.Meta> implements IData<$> {
  readonly #fallThroughTargetingParsers: $['FallThroughTargetingParsers']
  readonly #data: DataItemsOut<$>
  readonly #payloadParsers: $['PayloadParsers']
  readonly #targetingPredicates: TargetingPredicates<$>
  readonly #targetingParsers: $['TargetingParsers']
  readonly #queryParsers: $['QueryParsers']
  readonly #QueryParser: ZodPartialObject<$['QueryParsers']>

  /**
   * Create a new empty Data instance.
   *
   * @returns A PromisedData instance that can be configured with payloads, targeting, and rules.
   *
   * @example
   * ```ts
   * import { Data } from '@targetd/api'
   * import { z } from 'zod'
   *
   * const data = await Data.create()
   *   .usePayload({ greeting: z.string() })
   *   .addRules('greeting', [{ payload: 'Hello!' }])
   * ```
   */
  static create(): PromisedData<DT.EmptyMeta> {
    return PromisedData.create(new Data({}, {}, {}, {}, {}, {}))
  }

  /**
   * @see {@link Data.create}
   */
  private constructor(
    data: DataItemsOut<$>,
    payloadParsers: $['PayloadParsers'],
    targetingPredicates: TargetingPredicates<$>,
    targetingParsers: $['TargetingParsers'],
    queryParsers: $['QueryParsers'],
    fallThroughTargetingParsers: $['FallThroughTargetingParsers'],
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

  /**
   * Get all data items including rules and variables.
   *
   * @returns The complete data structure with all rules and variables.
   */
  get data(): DataItemsOut<$> {
    return this.#data
  }

  /**
   * Get all registered payload parsers (Zod schemas).
   *
   * @returns Object mapping payload names to their Zod schemas.
   */
  get payloadParsers(): $['PayloadParsers'] {
    return this.#payloadParsers
  }

  /**
   * Get all registered targeting predicates.
   *
   * @returns Object mapping targeting keys to their predicate functions and configuration.
   */
  get targetingPredicates(): TargetingPredicates<$> {
    return this.#targetingPredicates
  }

  /**
   * Get all registered targeting parsers (Zod schemas for rule targeting).
   *
   * @returns Object mapping targeting keys to their Zod schemas.
   */
  get targetingParsers(): $['TargetingParsers'] {
    return this.#targetingParsers
  }

  /**
   * Get all registered query parsers (Zod schemas for query parameters).
   *
   * @returns Object mapping query parameter names to their Zod schemas.
   */
  get queryParsers(): $['QueryParsers'] {
    return this.#queryParsers
  }

  /**
   * Get the combined query parser with all query parameters as optional.
   *
   * @returns Zod schema that validates query objects.
   */
  get QueryParser(): ZodPartialObject<$['QueryParsers'], $strict> {
    return this.#QueryParser
  }

  /**
   * Get all registered fall-through targeting parsers.
   *
   * @returns Object mapping fall-through targeting keys to their Zod schemas.
   */
  get fallThroughTargetingParsers(): $['FallThroughTargetingParsers'] {
    return this.#fallThroughTargetingParsers
  }

  /**
   * Define payload types using Zod schemas. This determines what data can be stored in the Data instance.
   *
   * @param parsers - Object mapping payload names to Zod schemas.
   * @returns A new Data instance with the payload parsers registered.
   *
   * @example
   * ```ts
   * import { Data } from '@targetd/api'
   * import { z } from 'zod'
   *
   * const data = await Data.create()
   *   .usePayload({
   *     message: z.string(),
   *     config: z.object({
   *       enabled: z.boolean(),
   *       maxRetries: z.number()
   *     })
   *   })
   * ```
   */
  async usePayload<Parsers extends $ZodShape>(parsers: Parsers): Promise<
    Data<$ & { PayloadParsers: $['PayloadParsers'] & Parsers }>
  > {
    type $$ = $ & { PayloadParsers: $['PayloadParsers'] & Parsers }

    const payloadParsers = this.#mergePayloadParsers(parsers)

    const data = (await DataItemsParser(
      payloadParsers,
      this.#targetingParsers,
      this.#fallThroughTargetingParsers,
    ).parseAsync(this.#data)) as DataItemsOut<$$>

    return new Data<$$>(
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
  ): $['PayloadParsers'] & Parsers {
    return {
      ...this.#payloadParsers,
      ...parsers,
    }
  }

  /**
   * Insert data from another Data instance or add new rules. Commonly used with fall-through targeting
   * to pass unresolved rules between services.
   *
   * @param data - Object mapping payload names to values or __rules__ structures from another Data instance.
   * @returns A new Data instance with the inserted data.
   *
   * @example
   * ```ts
   * const result = await data.getPayload('message', { channel: 'mobile' })
   * // result may contain { __rules__: [...], __variables__: {...} }
   *
   * const updated = await receivingData.insert({
   *   message: result
   * })
   * ```
   */
  async insert(data: DT.InsertableData<$>): Promise<Data<$>> {
    const newData = {
      ...this.#data,
      ...(await DataItemsParser(
        this.#payloadParsers,
        this.#targetingParsers,
        this.#fallThroughTargetingParsers,
        false,
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
              variables: {
                ...dataItem.variables,
                ...this.#isFallThroughRulesPayload(value!)
                  ? value.__variables__
                  : {},
              },
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

  readonly #isFallThroughRulesPayload = <
    Name extends keyof $['PayloadParsers'],
  >(
    payload: PT.Payload<$, $['PayloadParsers'][Name]>,
  ): payload is FTTT.Rules<$, $['PayloadParsers'][Name]> =>
    typeof payload === 'object' && payload !== null && '__rules__' in payload

  /**
   * Add targeting rules for a specific payload. Rules are evaluated in order—first match wins.
   *
   * @param name - The name of the payload to add rules for.
   * @param opts - Array of rules, or object with `rules` and optional `variables`.
   * @returns A new Data instance with the rules added.
   *
   * @example
   * ```ts
   * const data = await Data.create()
   *   .usePayload({ greeting: z.string() })
   *   .useTargeting({ country: targetIncludes(z.string()) })
   *   .addRules('greeting', [
   *     { targeting: { country: ['US'] }, payload: 'Hello!' },
   *     { targeting: { country: ['ES'] }, payload: '¡Hola!' },
   *     { payload: 'Hi!' } // default fallback
   *   ])
   * ```
   *
   * @example With variables:
   * ```ts
   * .addRules('config', {
   *   variables: {
   *     featureEnabled: [
   *       { targeting: { country: ['US'] }, payload: true },
   *       { payload: false }
   *     ]
   *   },
   *   rules: [
   *     { payload: { enabled: '{{featureEnabled}}' } }
   *   ]
   * })
   * ```
   */
  async addRules<
    Name extends keyof $['PayloadParsers'],
  >(
    name: Name,
    opts:
      | DataItemIn<$, $['PayloadParsers'][Name]>
      | DataItemRulesIn<$, $['PayloadParsers'][Name]>,
  ): Promise<Data<$>> {
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

  /**
   * Remove all rules from the Data instance while keeping payload parsers, targeting, and queries.
   *
   * @returns A new Data instance with all rules removed.
   *
   * @example
   * ```ts
   * const emptyData = data.removeAllRules()
   * // Parsers and targeting are preserved, but no rules remain
   * ```
   */
  removeAllRules(): Data<$> {
    return new Data(
      {} as any,
      this.#payloadParsers,
      this.#targetingPredicates,
      this.#targetingParsers,
      this.#queryParsers,
      this.#fallThroughTargetingParsers,
    )
  }

  /**
   * Define targeting descriptors that determine how rules are matched against queries.
   *
   * @param targeting - Object mapping targeting keys to targeting descriptors with predicate functions and parsers.
   * @returns A new Data instance with the targeting descriptors registered.
   *
   * @example Using built-in predicates:
   * ```ts
   * import { targetIncludes, targetEquals } from '@targetd/api'
   *
   * const data = await Data.create()
   *   .useTargeting({
   *     country: targetIncludes(z.string()),
   *     isPremium: targetEquals(z.boolean())
   *   })
   * ```
   *
   * @example Custom targeting descriptor:
   * ```ts
   * .useTargeting({
   *   timeOfDay: {
   *     predicate: (queryTime) => (targetTime) => queryTime === targetTime,
   *     queryParser: z.enum(['morning', 'afternoon', 'evening']),
   *     targetingParser: z.enum(['morning', 'afternoon', 'evening'])
   *   }
   * })
   * ```
   */
  async useTargeting<TDs extends TT.DescriptorRecord>(targeting: TDs): Promise<
    Data<
      $ & {
        TargetingParsers: $['TargetingParsers'] & TT.ParserRecord<TDs>
        QueryParsers: $['QueryParsers'] & QT.ParserRecord<TDs>
      }
    >
  > {
    type $$ = $ & {
      TargetingParsers: $['TargetingParsers'] & TT.ParserRecord<TDs>
      QueryParsers: $['QueryParsers'] & QT.ParserRecord<TDs>
    }

    const targetingParsers: $$['TargetingParsers'] = this
      .#mergeTargetingParsers(
        targeting,
      )

    const targetingPredicates = this.#mergeTargetingPredicates(
      targeting,
    ) as TargetingPredicates<$$>

    const queryParsers: $$['QueryParsers'] = this.#mergeQueryPredicates(
      targeting,
    )

    const data = await DataItemsParser(
      this.#payloadParsers,
      targetingParsers,
      this.#fallThroughTargetingParsers,
    ).parseAsync(this.#data) as DataItemsOut<$$>

    return new Data<$$>(
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
  ): $['TargetingParsers'] & TT.ParserRecord<TDs> {
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
  ): $['QueryParsers'] & QT.ParserRecord<TDs> {
    return {
      ...this.#queryParsers,
      ...objectMap(targeting, ({ queryParser }) => queryParser),
    }
  }

  /**
   * Define fall-through targeting for rules that cannot be fully evaluated in the current service.
   * These targeting conditions will be passed to another service for evaluation.
   *
   * @param targeting - Object mapping targeting keys to Zod parsers or targeting descriptors.
   * @returns A new Data instance with fall-through targeting registered.
   *
   * @example
   * ```ts
   * const data = await Data.create()
   *   .useTargeting({
   *     channel: targetIncludes(z.string())
   *   })
   *   .useFallThroughTargeting({
   *     region: z.array(z.string())
   *   })
   *   .addRules('message', [
   *     {
   *       targeting: {
   *         channel: ['mobile'],
   *         region: ['EU'] // fall-through
   *       },
   *       payload: 'EU mobile message'
   *     }
   *   ])
   *
   * const result = await data.getPayload('message', { channel: 'mobile' })
   * // Returns: { __rules__: [...], __variables__: {...} }
   * // Can be passed to another service with region context
   * ```
   */
  async useFallThroughTargeting<TDs extends FTTT.DescriptorRecord>(
    targeting: TDs,
  ): Promise<
    Data<
      $ & {
        FallThroughTargetingParsers:
          & $['FallThroughTargetingParsers']
          & FTTT.ParsersRecord<TDs>
      }
    >
  > {
    type $$ = $ & {
      FallThroughTargetingParsers:
        & $['FallThroughTargetingParsers']
        & FTTT.ParsersRecord<TDs>
    }

    const fallThroughTargetingParsers = this.#mergeFallThroughTargeting(
      targeting,
    )

    const data = (await DataItemsParser(
      this.#payloadParsers,
      this.#targetingParsers,
      fallThroughTargetingParsers,
    ).parseAsync(this.#data)) as DataItemsOut<$$>

    return new Data<$$>(
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
  ): $['FallThroughTargetingParsers'] & FTTT.ParsersRecord<TDs> {
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

  /**
   * Get payloads for all registered payload names at once.
   *
   * @param rawQuery - Optional query object with targeting parameters.
   * @returns Object mapping all payload names to their matched payloads.
   *
   * @example
   * ```ts
   * const allPayloads = await data.getPayloadForEachName({ country: 'US' })
   * // Returns: { greeting: 'Hello!', feature: {...}, ... }
   * ```
   */
  async getPayloadForEachName(
    rawQuery: QT.Raw<$['QueryParsers']> = {},
  ): Promise<PT.Payloads<$>> {
    const payloads = {} as PT.Payloads<$>

    await Promise.all(
      objectKeys(this.#data).map(async (name) => {
        payloads[name] = await this.getPayload(name, rawQuery)
      }),
    )

    return payloads
  }

  /**
   * Get the first matching payload for a specific name based on targeting rules.
   * Rules are evaluated in order—first match wins.
   *
   * @param name - The name of the payload to retrieve.
   * @param rawQuery - Optional query object with targeting parameters.
   * @returns The matched payload, or undefined if no rule matched.
   *
   * @example
   * ```ts
   * const greeting = await data.getPayload('greeting', { country: 'US' })
   * // Returns: 'Hello!'
   *
   * const defaultGreeting = await data.getPayload('greeting')
   * // Returns: 'Hi!' (default fallback)
   * ```
   *
   * @example With fall-through targeting:
   * ```ts
   * const result = await data.getPayload('message', { channel: 'mobile' })
   * // May return: { __rules__: [...], __variables__: {...} }
   * // if region targeting cannot be resolved
   * ```
   */
  async getPayload<Name extends keyof $['PayloadParsers']>(
    name: Name,
    rawQuery: QT.Raw<$['QueryParsers']> = {},
  ): Promise<
    | PT.Payload<$, $['PayloadParsers'][Name]>
    | undefined
  > {
    const predicate = await this.#createRulePredicate(rawQuery)
    const targetableItem = this.#getTargetableItem(name)
    let payload:
      | PT.Payload<$, $['PayloadParsers'][Name]>
      | undefined

    for (const rule of targetableItem.rules) {
      if (await predicate(rule)) {
        payload = this.#mapRule(rule)
        break
      }
    }

    if (payload === undefined) return

    const variables = await this.#getVariables(targetableItem, predicate)
    const resolvableVariables = objectFitler(
      variables,
      (value) => !this.#isFallThroughRulesPayload(value),
    )
    const nonResolvableVariables = objectFitler(
      variables,
      this.#isFallThroughRulesPayload,
    )
    const resolvedPayload = resolveVariables(
      resolvableVariables,
      payload,
    )

    return objectSize(nonResolvableVariables)
      ? {
        __variables__: objectMap(
          nonResolvableVariables,
          (value) => value.__rules__,
        ),
        __rules__: this.#isFallThroughRulesPayload(resolvedPayload)
          ? resolvedPayload.__rules__
          : [{ payload: resolvedPayload }],
      }
      : resolvedPayload
  }

  async #getVariables<Name extends keyof $['PayloadParsers']>(
    targetableItem: DataItemOut<$, $['PayloadParsers'][Name]>,
    predicate: (
      rule: DataItemRule<$, $['PayloadParsers'][Name]>,
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

  /**
   * Get all matching payloads for a specific name (not just the first match).
   * Useful for debugging or when you need to see all rules that match a query.
   *
   * @param name - The name of the payload to retrieve.
   * @param rawQuery - Optional query object with targeting parameters.
   * @returns Array of all matched payloads.
   *
   * @example
   * ```ts
   * const allMatches = await data.getPayloads('feature', { country: 'US' })
   * // Returns: ['Premium US feature', 'US feature']
   * // (if multiple rules matched)
   * ```
   */
  async getPayloads<Name extends keyof $['PayloadParsers']>(
    name: Name,
    rawQuery: QT.Raw<$['QueryParsers']> = {},
  ): Promise<
    PT.Payload<$, $['PayloadParsers'][Name]>[]
  > {
    const payloads: PT.Payload<$, $['PayloadParsers'][Name]>[] = []
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
    rule: DataItemRule<$, PayloadParser>,
  ): PT.Payload<$, PayloadParser> | undefined {
    return hasPayload(rule)
      ? rule.payload as output<PayloadParser>
      : 'fallThrough' in rule
      ? { __rules__: rule.fallThrough } as FTTT.Rules<$, PayloadParser>
      : undefined
  }

  async #createRulePredicate<Name extends keyof $['PayloadParsers']>(
    rawQuery: QT.Raw<$['QueryParsers']>,
  ) {
    const query = await this.#QueryParser.parseAsync(rawQuery)

    return (
      rule: DataItemRule<$, $['PayloadParsers'][Name]>,
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

  #getTargetableItem<Name extends keyof $['PayloadParsers']>(name: Name) {
    return (
      (
        this.#data as unknown as {
          [Name in keyof $['PayloadParsers']]: DataItemOut<
            $,
            $['PayloadParsers'][Name]
          >
        }
      )[name] ?? { rules: [], variables: {} }
    )
  }

  async #targetingPredicate(
    query: $InferObjectOutput<
      { [K in keyof $['QueryParsers']]: $ZodOptional<$['QueryParsers'][K]> },
      {}
    >,
    targeting: MaybeArray<
      $InferObjectOutput<
        {
          [K in keyof $['TargetingParsers']]: $ZodOptional<
            $['TargetingParsers'][K]
          >
        },
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
