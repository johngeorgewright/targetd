import z, { ZodRawShape } from 'zod'
import TargetingDescriptor, {
  isTargetingDescriptor,
} from './validators/TargetingDescriptor'
import TargetingPredicates from './validators/TargetingPredicates'
import { objectEveryAsync, objectKeys, objectMap, omit } from './util'
import DataItems from './validators/DataItems'
import DataItem from './validators/DataItem'
import DataItemRule, { RuleWithPayload } from './validators/DataItemRule'
import { Keys } from 'ts-toolbelt/out/Any/Keys'
import { MaybePromise, StaticRecord, ZodPartialObject } from './types'

export default class Data<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape,
  FallThroughTargetingValidators extends z.ZodRawShape
> {
  readonly #fallThroughTargetingValidators: FallThroughTargetingValidators
  readonly #data: z.infer<
    DataItems<
      DataValidators,
      TargetingValidators,
      FallThroughTargetingValidators
    >
  >
  readonly #dataValidators: DataValidators
  readonly #targetingPredicates: TargetingPredicates<
    TargetingValidators,
    QueryValidators
  >
  readonly #targetingValidators: TargetingValidators
  readonly #queryValidators: QueryValidators
  readonly #QueryValidator: ZodPartialObject<QueryValidators, 'strict'>

  static create() {
    return new Data({}, {}, {}, {}, {}, {})
  }

  private constructor(
    data: z.infer<
      DataItems<
        DataValidators,
        TargetingValidators,
        FallThroughTargetingValidators
      >
    >,
    dataValidators: DataValidators,
    targetingPredicates: TargetingPredicates<
      TargetingValidators,
      QueryValidators
    >,
    targetingValidators: TargetingValidators,
    queryValidators: QueryValidators,
    fallThroughTargetingValidators: FallThroughTargetingValidators
  ) {
    this.#fallThroughTargetingValidators = Object.freeze(
      fallThroughTargetingValidators
    )
    this.#data = Object.freeze(data)
    this.#dataValidators = Object.freeze(dataValidators)
    this.#targetingPredicates = Object.freeze(targetingPredicates)
    this.#targetingValidators = Object.freeze(targetingValidators)
    this.#queryValidators = Object.freeze(queryValidators)
    this.#QueryValidator = z.strictObject(this.#queryValidators).partial()
  }

  get data(): z.infer<
    DataItems<
      DataValidators,
      TargetingValidators,
      FallThroughTargetingValidators
    >
  > {
    return this.#data
  }

  get dataValidators() {
    return this.#dataValidators
  }

  get targetingPredicates() {
    return this.#targetingPredicate
  }

  get targetingValidators() {
    return this.#targetingValidators
  }

  get queryValidators() {
    return this.#queryValidators
  }

  get QueryValidator() {
    return this.#QueryValidator
  }

  get fallThroughTargetingValidators() {
    return this.#fallThroughTargetingValidators
  }

  useDataValidator<Name extends string, Validator extends z.ZodTypeAny>(
    name: Name,
    validator: Validator
  ) {
    const dataValidators = {
      ...this.#dataValidators,
      [name]: validator,
    }

    return new Data<
      DataValidators & Record<Name, Validator>,
      TargetingValidators,
      QueryValidators,
      FallThroughTargetingValidators
    >(
      (name in this.#data
        ? DataItems(
            dataValidators,
            this.#targetingValidators,
            this.#fallThroughTargetingValidators
          ).parse(this.#data)
        : this.#data) as z.infer<
        DataItems<
          DataValidators & Record<Name, Validator>,
          TargetingValidators,
          FallThroughTargetingValidators
        >
      >,
      dataValidators,
      this.#targetingPredicates,
      this.#targetingValidators,
      this.#queryValidators,
      this.#fallThroughTargetingValidators
    )
  }

  insert(
    data: Partial<{
      [Name in keyof DataValidators]:
        | z.infer<DataValidators[Name]>
        | FallThroughRules<DataValidators[Name], TargetingValidators>
        | FallThroughRules<DataValidators[Name], FallThroughTargetingValidators>
    }>
  ) {
    return Object.entries(omit(data, ['$schema'])).reduce<
      Data<
        DataValidators,
        TargetingValidators,
        QueryValidators,
        FallThroughTargetingValidators
      >
    >(
      (d, [key, value]) =>
        d.addRules(
          key as Keys<DataValidators>,
          this.#isFallThroughRulesPayload(value)
            ? this.#isConsumableFallThroughRulesPayload(value)
              ? value.__rules__
              : [{ fallThrough: value.__rules__ }]
            : [{ payload: value } as any]
        ),
      this
    )
  }

  #isFallThroughRulesPayload<Name extends keyof DataValidators>(
    payload: Payload<z.infer<DataValidators[Name]>, TargetingValidators>
  ): payload is FallThroughRules<
    z.infer<DataValidators[Name]>,
    TargetingValidators
  > {
    return (
      typeof payload === 'object' && payload !== null && '__rules__' in payload
    )
  }

  #isConsumableFallThroughRulesPayload<Name extends keyof DataValidators>(
    payload: FallThroughRules<
      z.infer<DataValidators[Name]>,
      TargetingValidators
    >
  ) {
    return payload.__rules__.every(
      (rule) =>
        !rule.targeting ||
        Object.keys(rule.targeting).every(
          (key) => key in this.#targetingValidators
        )
    )
  }

  addRules<Name extends Keys<DataValidators>>(
    name: Name,
    rules: z.infer<
      DataItemRule<
        DataValidators[Name],
        TargetingValidators,
        FallThroughTargetingValidators
      >
    >[]
  ) {
    const dataItem = (this.#data as any)[name] || {}
    return new Data(
      {
        ...this.#data,
        ...DataItems(
          this.#dataValidators,
          this.#targetingValidators,
          this.#fallThroughTargetingValidators
        ).parse({
          [name]: {
            ...dataItem,
            rules: [...(dataItem.rules || []), ...rules],
          },
        }),
      },
      this.#dataValidators,
      this.#targetingPredicates,
      this.#targetingValidators,
      this.#queryValidators,
      this.#fallThroughTargetingValidators
    )
  }

  removeAllRules() {
    return new Data(
      DataItems(
        this.#dataValidators,
        this.#targetingValidators,
        this.#fallThroughTargetingValidators
      ).parse({}),
      this.#dataValidators,
      this.#targetingPredicates,
      this.#targetingValidators,
      this.#queryValidators,
      this.#fallThroughTargetingValidators
    )
  }

  useTargeting<
    Name extends string,
    TV extends z.ZodTypeAny,
    QV extends z.ZodTypeAny
  >(name: Name, targetingDescriptor: TargetingDescriptor<TV, QV>) {
    type NewTargeting = TargetingValidators & { [K in Name]: TV }
    type NewQuery = QueryValidators & { [K in Name]: QV }

    const targetingValidators = {
      ...this.#targetingValidators,
      [name]: targetingDescriptor.targetingValidator,
    }

    return new Data<
      DataValidators,
      NewTargeting,
      NewQuery,
      FallThroughTargetingValidators
    >(
      DataItems(
        this.#dataValidators,
        targetingValidators,
        this.#fallThroughTargetingValidators
      ).parse(this.#data) as z.infer<
        DataItems<DataValidators, NewTargeting, FallThroughTargetingValidators>
      >,
      this.#dataValidators,
      {
        ...this.#targetingPredicates,
        [name]: {
          predicate: targetingDescriptor.predicate,
          requiresQuery:
            'requiresQuery' in targetingDescriptor
              ? targetingDescriptor.requiresQuery
              : true,
        },
      } as any,
      targetingValidators,
      {
        ...this.#queryValidators,
        [name]: targetingDescriptor.queryValidator,
      },
      this.#fallThroughTargetingValidators
    )
  }

  useFallThroughTargeting<
    Name extends string,
    TV extends z.ZodTypeAny,
    QV extends z.ZodTypeAny
  >(name: Name, targetingValidator: TV | TargetingDescriptor<TV, QV>) {
    type NewFallThroughTargeting = FallThroughTargetingValidators & {
      [K in Name]: TV
    }

    const fallThroughTargetingValidators = {
      ...this.#fallThroughTargetingValidators,
      [name]: isTargetingDescriptor(targetingValidator)
        ? targetingValidator.targetingValidator
        : targetingValidator,
    } as NewFallThroughTargeting

    return new Data<
      DataValidators,
      TargetingValidators,
      QueryValidators,
      NewFallThroughTargeting
    >(
      DataItems(
        this.#dataValidators,
        this.#targetingValidators,
        fallThroughTargetingValidators
      ).parse(this.#data) as z.infer<
        DataItems<DataValidators, TargetingValidators, NewFallThroughTargeting>
      >,
      this.#dataValidators,
      this.#targetingPredicates,
      this.#targetingValidators,
      this.#queryValidators,
      fallThroughTargetingValidators
    )
  }

  async getPayloadForEachName(
    rawQuery: Partial<StaticRecord<QueryValidators>> = {}
  ) {
    const payloads = {} as Partial<{
      [Name in keyof DataValidators]:
        | Payload<DataValidators[Name], TargetingValidators>
        | undefined
    }>

    await Promise.all(
      objectKeys(this.#data).map(async (name) => {
        payloads[name] = await this.getPayload(name, rawQuery)
      })
    )

    return payloads
  }

  async getPayload<Name extends keyof DataValidators>(
    name: Name,
    rawQuery: Partial<StaticRecord<QueryValidators>> = {}
  ): Promise<Payload<DataValidators[Name], TargetingValidators> | void> {
    const predicate = this.#createRulePredicate(rawQuery)
    for (const rule of this.#getTargetableRules(name))
      if (await predicate(rule as any)) return this.#mapRule(rule)
  }

  async getPayloads<Name extends keyof DataValidators>(
    name: Name,
    rawQuery: Partial<StaticRecord<QueryValidators>> = {}
  ): Promise<Payload<DataValidators[Name], TargetingValidators>[]> {
    const payloads: Payload<DataValidators[Name], TargetingValidators>[] = []
    const predicate = this.#createRulePredicate(rawQuery)
    for (const rule of this.#getTargetableRules(name))
      if (await predicate(rule as any)) payloads.push(this.#mapRule(rule))
    return payloads
  }

  #mapRule<Name extends keyof DataValidators>(
    rule: z.infer<
      DataItemRule<
        DataValidators[Name],
        TargetingValidators,
        FallThroughTargetingValidators
      >
    >
  ) {
    return hasPayload(rule)
      ? rule.payload
      : 'fallThrough' in rule
      ? { __rules__: rule.fallThrough }
      : undefined
  }

  #createRulePredicate<Name extends keyof DataValidators>(
    rawQuery: Partial<StaticRecord<QueryValidators>>
  ) {
    const query = this.#QueryValidator.parse(rawQuery)

    const targeting = objectMap(
      this.#targetingPredicates,
      (target, targetingKey) => ({
        predicate: target.predicate(query[targetingKey]),
        requiresQuery: target.requiresQuery,
      })
    )

    return (
      rule: z.infer<
        DataItemRule<
          DataValidators[Name],
          TargetingValidators,
          FallThroughTargetingValidators
        >
      >
    ) =>
      !('targeting' in rule) ||
      this.#targetingPredicate(query, rule.targeting!, targeting)
  }

  #getTargetableRules<Name extends keyof DataValidators>(name: Name) {
    return (
      (
        this.#data as unknown as {
          [Name in keyof DataValidators]: z.infer<
            DataItem<
              DataValidators[Name],
              TargetingValidators,
              FallThroughTargetingValidators
            >
          >
        }
      )[name]?.rules || []
    )
  }

  #targetingPredicate(
    query: Partial<StaticRecord<QueryValidators>>,
    targeting: Partial<StaticRecord<TargetingValidators>>,
    predicates: Record<
      any,
      {
        predicate: MaybePromise<(targeting: unknown) => MaybePromise<boolean>>
        requiresQuery: boolean
      }
    >
  ) {
    return objectEveryAsync(targeting, async (targetingValue, targetingKey) => {
      if (!(targetingKey in query) && predicates[targetingKey]?.requiresQuery)
        return false

      if (targetingKey in predicates)
        return (await predicates[targetingKey].predicate)(targetingValue)
      else console.warn(`Invalid targeting property ${String(targetingKey)}`)

      return false
    })
  }
}

function hasPayload<Payload>(x: any): x is { payload: Payload } {
  return 'payload' in x
}

export type FallThroughRules<
  P extends z.ZodTypeAny,
  T extends z.ZodRawShape
> = {
  __rules__: z.infer<RuleWithPayload<P, T>>[]
}

export type Payload<P extends z.ZodTypeAny, T extends z.ZodRawShape> =
  | z.infer<P>
  | FallThroughRules<P, T>

export type DataValidators<
  D extends Data<ZodRawShape, ZodRawShape, ZodRawShape, ZodRawShape>
> = D extends Data<infer V, ZodRawShape, ZodRawShape, ZodRawShape> ? V : never

export type TargetingValidators<
  D extends Data<ZodRawShape, ZodRawShape, ZodRawShape, ZodRawShape>
> = D extends Data<ZodRawShape, infer V, ZodRawShape, ZodRawShape> ? V : never

export type QueryValidators<
  D extends Data<ZodRawShape, ZodRawShape, ZodRawShape, ZodRawShape>
> = D extends Data<ZodRawShape, ZodRawShape, infer V, ZodRawShape> ? V : never

export type FallThroughTargetingValidators<
  D extends Data<ZodRawShape, ZodRawShape, ZodRawShape, ZodRawShape>
> = D extends Data<ZodRawShape, ZodRawShape, ZodRawShape, infer V> ? V : never
