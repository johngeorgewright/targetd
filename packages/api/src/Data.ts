import z, { ZodNever, ZodRawShape } from 'zod'
import TargetingDescriptor, {
  TargetingDescriptorQueryValidator,
  TargetingDescriptorTargetingValidator,
  isTargetingDescriptor,
} from './validators/TargetingDescriptor'
import TargetingPredicates from './validators/TargetingPredicates'
import { objectEveryAsync, objectKeys, objectMap, omit } from './util'
import DataItems from './validators/DataItems'
import DataItemRule, { RuleWithPayload } from './validators/DataItemRule'
import { Keys } from 'ts-toolbelt/out/Any/Keys'
import { MaybePromise, StaticRecord, ZodPartialObject } from './types'
import DataItemRules from './validators/DataItemRules'
import TargetingPredicate from './validators/TargetingPredicate'

export default class Data<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape,
  FallThroughTargetingValidators extends z.ZodRawShape,
  StateValidators extends z.ZodRawShape,
  StateTargetingValidators extends z.ZodRawShape,
> {
  readonly #fallThroughTargetingValidators: FallThroughTargetingValidators
  readonly #data: z.infer<
    DataItems<
      DataValidators,
      TargetingValidators,
      FallThroughTargetingValidators
    >
  >
  readonly #state: z.infer<
    DataItems<StateValidators, StateTargetingValidators, {}>
  >
  readonly #dataValidators: DataValidators
  readonly #stateValidators: StateValidators
  readonly #targetingPredicates: TargetingPredicates<
    TargetingValidators,
    QueryValidators
  >
  readonly #targetingValidators: TargetingValidators
  readonly #stateTargetingPredicates: TargetingPredicates<
    StateTargetingValidators,
    QueryValidators
  >
  readonly #stateTargetingValidators: StateTargetingValidators
  readonly #queryValidators: QueryValidators
  readonly #QueryValidator: ZodPartialObject<QueryValidators, 'strict'>

  static create() {
    return new Data({}, {}, {}, {}, {}, {}, {}, {}, {}, {})
  }

  private constructor(
    data: z.infer<
      DataItems<
        DataValidators,
        TargetingValidators,
        FallThroughTargetingValidators
      >
    >,
    state: z.infer<DataItems<StateValidators, StateTargetingValidators, {}>>,
    dataValidators: DataValidators,
    targetingPredicates: TargetingPredicates<
      TargetingValidators,
      QueryValidators
    >,
    targetingValidators: TargetingValidators,
    queryValidators: QueryValidators,
    fallThroughTargetingValidators: FallThroughTargetingValidators,
    stateValidators: StateValidators,
    stateTargetingPredicates: TargetingPredicates<
      StateTargetingValidators,
      QueryValidators
    >,
    stateTargetingValidators: StateTargetingValidators,
  ) {
    this.#fallThroughTargetingValidators = Object.freeze(
      fallThroughTargetingValidators,
    )
    this.#data = Object.freeze(data)
    this.#state = Object.freeze(state)
    this.#dataValidators = Object.freeze(dataValidators)
    this.#targetingPredicates = Object.freeze(targetingPredicates)
    this.#targetingValidators = Object.freeze(targetingValidators)
    this.#stateValidators = Object.freeze(stateValidators)
    this.#stateTargetingPredicates = Object.freeze(stateTargetingPredicates)
    this.#stateTargetingValidators = Object.freeze(stateTargetingValidators)
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

  get stateValidators() {
    return this.#stateValidators
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
    validator: Validator,
  ) {
    type NewDataValidators = DataValidators & Record<Name, Validator>

    const dataValidators = {
      ...this.#dataValidators,
      [name]: validator,
    }

    const data = (
      name in this.#data
        ? DataItems(
            dataValidators,
            this.#targetingValidators,
            this.#fallThroughTargetingValidators,
          ).parse(this.#data)
        : this.#data
    ) as z.infer<
      DataItems<
        NewDataValidators,
        TargetingValidators,
        FallThroughTargetingValidators
      >
    >

    return new Data<
      NewDataValidators,
      TargetingValidators,
      QueryValidators,
      FallThroughTargetingValidators,
      StateValidators,
      StateTargetingValidators
    >(
      data,
      this.#state,
      dataValidators,
      this.#targetingPredicates,
      this.#targetingValidators,
      this.#queryValidators,
      this.#fallThroughTargetingValidators,
      this.#stateValidators,
      this.#stateTargetingPredicates,
      this.#stateTargetingValidators,
    )
  }

  useState<
    Name extends string,
    Validator extends z.ZodTypeAny,
    TargetingValidator extends z.ZodTypeAny,
  >(
    name: Name,
    {
      targetingPredicate,
      targetingValidator,
      validator,
    }: {
      validator: Validator
      targetingValidator: TargetingValidator
      targetingPredicate: TargetingPredicate<Validator, TargetingValidator>
    },
  ) {
    type NewStateValidators = StateValidators & Record<Name, Validator>

    type NewTargetingValidators = TargetingValidators &
      Record<Name, TargetingValidator>

    type NewQueryValidators = QueryValidators & Record<Name, ZodNever>

    const stateValidators: NewStateValidators = {
      ...this.#stateValidators,
      [name]: validator,
    }

    const targetingValidators: NewTargetingValidators = {
      ...this.#targetingValidators,
      [name]: targetingValidator,
    }

    const targetingPredicates: any = {
      ...this.#targetingPredicates,
      [name]: {
        predicate: targetingPredicate,
      },
    }

    const queryValidators: NewQueryValidators = {
      ...this.#queryValidators,
      [name]: z.never(),
    }

    const data = DataItems(
      this.#dataValidators,
      targetingValidators,
      this.#fallThroughTargetingValidators,
    ).parse(this.#data)

    const state = (
      name in this.#state
        ? DataItems(stateValidators, this.#stateTargetingValidators, {}).parse(
            this.#state,
          )
        : this.#state
    ) as z.infer<DataItems<NewStateValidators, StateTargetingValidators, {}>>

    return new Data<
      DataValidators,
      NewTargetingValidators,
      NewQueryValidators,
      FallThroughTargetingValidators,
      NewStateValidators,
      StateTargetingValidators
    >(
      data,
      state,
      this.#dataValidators,
      targetingPredicates,
      targetingValidators,
      queryValidators,
      this.#fallThroughTargetingValidators,
      stateValidators,
      this.#stateTargetingPredicates,
      this.#stateTargetingValidators,
    )
  }

  insert(
    data: Partial<{
      [Name in keyof DataValidators]:
        | z.infer<DataValidators[Name]>
        | FallThroughRules<DataValidators[Name], TargetingValidators>
        | FallThroughRules<DataValidators[Name], FallThroughTargetingValidators>
    }>,
  ) {
    return Object.entries(omit(data, ['$schema'])).reduce<
      Data<
        DataValidators,
        TargetingValidators,
        QueryValidators,
        FallThroughTargetingValidators,
        StateValidators,
        StateTargetingValidators
      >
    >(
      (d, [key, value]) =>
        d.addRules(
          key as Keys<DataValidators>,
          this.#isFallThroughRulesPayload(value)
            ? value.__rules__
            : [{ payload: value } as any],
        ),
      this,
    )
  }

  #isFallThroughRulesPayload<Name extends keyof DataValidators>(
    payload: Payload<z.infer<DataValidators[Name]>, TargetingValidators>,
  ): payload is FallThroughRules<
    z.infer<DataValidators[Name]>,
    TargetingValidators
  > {
    return (
      typeof payload === 'object' && payload !== null && '__rules__' in payload
    )
  }

  addRules<Name extends Keys<DataValidators>>(
    name: Name,
    rules: z.input<
      DataItemRules<
        DataValidators[Name],
        TargetingValidators,
        FallThroughTargetingValidators
      >
    >,
  ) {
    const dataItem = this.#data[name] || { rules: [] }
    return new Data(
      {
        ...this.#data,
        ...DataItems(
          this.#dataValidators,
          this.#targetingValidators,
          this.#fallThroughTargetingValidators,
        ).parse({
          [name]: {
            ...dataItem,
            rules: [...dataItem.rules, ...rules],
          },
        }),
      },
      this.#state,
      this.#dataValidators,
      this.#targetingPredicates,
      this.#targetingValidators,
      this.#queryValidators,
      this.#fallThroughTargetingValidators,
      this.#stateValidators,
      this.#stateTargetingPredicates,
      this.#stateTargetingValidators,
    )
  }

  addState<Name extends Keys<StateValidators>>(
    name: Name,
    rules: z.input<
      DataItemRules<StateValidators[Name], TargetingValidators, {}>
    >,
  ) {
    const stateItem = this.#state[name] || { rules: [] }
    return new Data(
      this.#data,
      {
        ...this.#state,
        ...DataItems(
          this.#stateValidators,
          this.#targetingValidators,
          {},
        ).parse({
          [name]: {
            ...stateItem,
            rules: [...stateItem.rules, ...rules],
          },
        }),
      },
      this.#dataValidators,
      this.#targetingPredicates,
      this.#targetingValidators,
      this.#queryValidators,
      this.#fallThroughTargetingValidators,
      this.#stateValidators,
      this.#stateTargetingPredicates,
      this.#stateTargetingValidators,
    )
  }

  removeAllRules() {
    return new Data(
      DataItems(
        this.#dataValidators,
        this.#targetingValidators,
        this.#fallThroughTargetingValidators,
      ).parse({}),
      this.#state,
      this.#dataValidators,
      this.#targetingPredicates,
      this.#targetingValidators,
      this.#queryValidators,
      this.#fallThroughTargetingValidators,
      this.#stateValidators,
      this.#stateTargetingPredicates,
      this.#stateTargetingValidators,
    )
  }

  useTargetingDescriptors<
    TDs extends Record<string, TargetingDescriptor<any, any>>,
  >(targeting: TDs) {
    type NewTargetingValidators = TargetingValidators & {
      [K in keyof TDs]: TargetingDescriptorTargetingValidator<TDs[K]>
    }

    type NewStateTargetingValidators = StateTargetingValidators & {
      [K in keyof TDs]: TargetingDescriptorTargetingValidator<TDs[K]>
    }

    type NewQueryValidators = QueryValidators & {
      [K in keyof TDs]: TargetingDescriptorQueryValidator<TDs[K]>
    }

    const targetingValidators: NewTargetingValidators = {
      ...this.targetingValidators,
      ...objectMap(targeting, ({ targetingValidator }) => targetingValidator),
    }

    const targetingPredicates: TargetingPredicates<
      NewTargetingValidators,
      NewQueryValidators
    > = {
      ...this.#targetingPredicates,
      ...objectMap(targeting, (targetingDescriptor) => ({
        predicate: targetingDescriptor.predicate,
        requiresQuery:
          'requiresQuery' in targetingDescriptor
            ? targetingDescriptor.requiresQuery
            : true,
      })),
    }

    const queryValidators: NewQueryValidators = {
      ...this.#queryValidators,
      ...objectMap(targeting, ({ queryValidator }) => queryValidator),
    }

    const stateTargetingValidators: NewStateTargetingValidators = {
      ...this.#stateTargetingValidators,
      ...objectMap(targeting, ({ targetingValidator }) => targetingValidator),
    }

    const stateTargetingPredicates: TargetingPredicates<
      NewStateTargetingValidators,
      NewQueryValidators
    > = {
      ...this.#stateTargetingPredicates,
      ...objectMap(targeting, (targetingDescriptor) => ({
        predicate: targetingDescriptor.predicate,
        requiresQuery:
          'requiresQuery' in targetingDescriptor
            ? targetingDescriptor.requiresQuery
            : true,
      })),
    }

    const data = DataItems(
      this.#dataValidators,
      targetingValidators,
      this.#fallThroughTargetingValidators,
    ).parse(this.#data)

    const state = DataItems(
      this.#stateValidators,
      stateTargetingValidators,
      {},
    ).parse(this.#state)

    return new Data<
      DataValidators,
      NewTargetingValidators,
      NewQueryValidators,
      FallThroughTargetingValidators,
      StateValidators,
      NewStateTargetingValidators
    >(
      data,
      state,
      this.#dataValidators,
      targetingPredicates,
      targetingValidators,
      queryValidators,
      this.#fallThroughTargetingValidators,
      this.#stateValidators,
      stateTargetingPredicates,
      stateTargetingValidators,
    )
  }

  useTargeting<
    Name extends string,
    TV extends z.ZodTypeAny,
    QV extends z.ZodTypeAny,
  >(name: Name, targetingDescriptor: TargetingDescriptor<TV, QV>) {
    type NewTargeting = TargetingValidators & { [K in Name]: TV }
    type NewStateTargeting = StateTargetingValidators & { [K in Name]: TV }
    type NewQuery = QueryValidators & { [K in Name]: QV }

    const targetingValidators: NewTargeting = {
      ...this.#targetingValidators,
      [name]: targetingDescriptor.targetingValidator,
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

    const queryValidators: NewQuery = {
      ...this.#queryValidators,
      [name]: targetingDescriptor.queryValidator,
    }

    const stateTargetingValidators: NewStateTargeting = {
      ...this.#stateTargetingValidators,
      [name]: targetingDescriptor.targetingValidator,
    }

    const stateTargetingPredicates: any = {
      ...this.#stateTargetingPredicates,
      [name]: {
        predicate: targetingDescriptor.predicate,
        requiresQuery:
          'requiresQuery' in targetingDescriptor
            ? targetingDescriptor.requiresQuery
            : true,
      },
    }

    const data = DataItems(
      this.#dataValidators,
      targetingValidators,
      this.#fallThroughTargetingValidators,
    ).parse(this.#data)

    const state = DataItems(
      this.#stateValidators,
      stateTargetingValidators,
      {},
    ).parse(this.#state)

    return new Data<
      DataValidators,
      NewTargeting,
      NewQuery,
      FallThroughTargetingValidators,
      StateValidators,
      NewStateTargeting
    >(
      data,
      state,
      this.#dataValidators,
      targetingPredicates,
      targetingValidators,
      queryValidators,
      this.#fallThroughTargetingValidators,
      this.#stateValidators,
      stateTargetingPredicates,
      stateTargetingValidators,
    )
  }

  useFallThroughTargetingDescriptors<
    TDs extends Record<string, TargetingDescriptor<any, any>>,
  >(targeting: TDs) {
    type NewFallThroughTargetingValidators = FallThroughTargetingValidators & {
      [K in keyof TDs]: TargetingDescriptorTargetingValidator<TDs[K]>
    }

    const fallThroughTargetingValidators = {
      ...this.#fallThroughTargetingValidators,
      ...objectMap(targeting, ({ targetingValidator }) => targetingValidator),
    } as NewFallThroughTargetingValidators

    return new Data<
      DataValidators,
      TargetingValidators,
      QueryValidators,
      NewFallThroughTargetingValidators,
      StateValidators,
      StateTargetingValidators
    >(
      DataItems(
        this.#dataValidators,
        this.#targetingValidators,
        fallThroughTargetingValidators,
      ).parse(this.#data),
      this.#state,
      this.#dataValidators,
      this.#targetingPredicates,
      this.#targetingValidators,
      this.#queryValidators,
      fallThroughTargetingValidators,
      this.#stateValidators,
      this.#stateTargetingPredicates,
      this.#stateTargetingValidators,
    )
  }

  useFallThroughTargeting<
    Name extends string,
    TV extends z.ZodTypeAny,
    QV extends z.ZodTypeAny,
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
      NewFallThroughTargeting,
      StateValidators,
      StateTargetingValidators
    >(
      DataItems(
        this.#dataValidators,
        this.#targetingValidators,
        fallThroughTargetingValidators,
      ).parse(this.#data),
      this.#state,
      this.#dataValidators,
      this.#targetingPredicates,
      this.#targetingValidators,
      this.#queryValidators,
      fallThroughTargetingValidators,
      this.#stateValidators,
      this.#stateTargetingPredicates,
      this.#stateTargetingValidators,
    )
  }

  async getPayloadForEachName(
    rawQuery: Partial<StaticRecord<QueryValidators>> = {},
  ) {
    const payloads = {} as Partial<{
      [Name in keyof DataValidators]:
        | Payload<DataValidators[Name], TargetingValidators>
        | undefined
    }>

    await Promise.all(
      objectKeys(this.#data).map(async (name) => {
        payloads[name] = await this.getPayload(name, rawQuery)
      }),
    )

    return payloads
  }

  async getPayload<Name extends keyof DataValidators>(
    name: Name,
    rawQuery: Partial<StaticRecord<QueryValidators>> = {},
  ): Promise<Payload<DataValidators[Name], TargetingValidators> | void> {
    const predicate = this.#createRulePredicate(
      rawQuery,
      await this.#getAllState(rawQuery),
    )
    for (const rule of this.#getTargetableRules(name))
      if (await predicate(rule as any)) return this.#mapRule(rule as any)
  }

  async #getAllState(rawQuery: Partial<StaticRecord<QueryValidators>> = {}) {
    const payloads: Partial<{
      [Name in keyof StateValidators]: Payload<
        StateValidators[Name],
        StateTargetingValidators
      >
    }> = {}

    await Promise.all(
      objectKeys(this.#state).map(async (name) => {
        payloads[name] = await this.#getState(name, rawQuery)
      }),
    )

    return payloads
  }

  async #getState<Name extends keyof StateValidators>(
    name: Name,
    rawQuery: Partial<StaticRecord<QueryValidators>> = {},
  ): Promise<Payload<StateValidators[Name], TargetingValidators> | void> {
    const predicate = this.#createRulePredicate(rawQuery)
    const rules = this.#state[name]?.rules || []
    for (const rule of rules)
      if (await predicate(rule as any)) return this.#mapRule(rule as any)
  }

  async getPayloads<Name extends keyof DataValidators>(
    name: Name,
    rawQuery: Partial<StaticRecord<QueryValidators>> = {},
  ): Promise<Payload<DataValidators[Name], TargetingValidators>[]> {
    const payloads: Payload<DataValidators[Name], TargetingValidators>[] = []
    const predicate = this.#createRulePredicate(
      rawQuery,
      await this.#getAllState(rawQuery),
    )
    for (const rule of this.#getTargetableRules(name))
      if (await predicate(rule as any))
        payloads.push(this.#mapRule(rule as any))
    return payloads
  }

  #mapRule<Name extends keyof DataValidators>(
    rule: z.infer<
      DataItemRule<
        DataValidators[Name],
        TargetingValidators,
        FallThroughTargetingValidators
      >
    >,
  ) {
    return hasPayload(rule)
      ? rule.payload
      : 'fallThrough' in rule
        ? { __rules__: rule.fallThrough }
        : undefined
  }

  #createRulePredicate<Name extends keyof DataValidators>(
    rawQuery: Partial<StaticRecord<QueryValidators>>,
    state: Partial<{
      [Name in keyof StateValidators]: Payload<
        StateValidators[Name],
        StateTargetingValidators
      >
    }> = {},
  ) {
    const query = {
      ...this.#QueryValidator.parse(rawQuery),
      ...state,
    }

    const targeting = objectMap(
      this.#targetingPredicates,
      (target, targetingKey) => ({
        predicate: target.predicate(query[targetingKey]),
        requiresQuery: target.requiresQuery,
      }),
    )

    return (
      rule: z.infer<
        DataItemRule<
          DataValidators[Name],
          TargetingValidators,
          FallThroughTargetingValidators
        >
      >,
    ) =>
      !('targeting' in rule) ||
      this.#targetingPredicate(query, rule.targeting!, targeting)
  }

  #getTargetableRules<Name extends keyof DataValidators>(name: Name) {
    return this.#data[name]?.rules || []
  }

  async #targetingPredicate(
    query: Partial<StaticRecord<QueryValidators>>,
    targeting:
      | Partial<StaticRecord<TargetingValidators>>
      | Partial<StaticRecord<TargetingValidators>>[],
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

export type FallThroughRules<
  P extends z.ZodTypeAny,
  T extends z.ZodRawShape,
> = {
  __rules__: z.infer<RuleWithPayload<P, T>>[]
}

export type Payload<P extends z.ZodTypeAny, T extends z.ZodRawShape> =
  | z.infer<P>
  | FallThroughRules<P, T>

export type DataValidators<
  D extends Data<
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape
  >,
> =
  D extends Data<
    infer V,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape
  >
    ? V
    : never

export type TargetingValidators<
  D extends Data<
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape
  >,
> =
  D extends Data<
    ZodRawShape,
    infer V,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape
  >
    ? V
    : never

export type QueryValidators<
  D extends Data<
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape
  >,
> =
  D extends Data<
    ZodRawShape,
    ZodRawShape,
    infer V,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape
  >
    ? V
    : never

export type FallThroughTargetingValidators<
  D extends Data<
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape
  >,
> =
  D extends Data<
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    infer V,
    ZodRawShape,
    ZodRawShape
  >
    ? V
    : never

export type StateValidators<
  D extends Data<
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape
  >,
> =
  D extends Data<
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    infer V,
    ZodRawShape
  >
    ? V
    : never

export type StateTargetingValidators<
  D extends Data<
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape
  >,
> =
  D extends Data<
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    infer V
  >
    ? V
    : never

export type FallThroughData<
  D extends Data<
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape,
    ZodRawShape
  >,
> = Data<
  DataValidators<D>,
  { [K in keyof FallThroughTargetingValidators<D>]: z.ZodType },
  Omit<QueryValidators<D>, keyof TargetingValidators<D>>,
  {},
  {},
  {}
>
