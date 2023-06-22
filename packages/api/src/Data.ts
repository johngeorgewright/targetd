import z from 'zod'
import TargetingDescriptor, {
  isTargetingDescriptor,
} from './validators/TargetingDescriptor'
import TargetingPredicates from './validators/TargetingPredicates'
import { objectEveryAsync, objectKeys, objectMap } from './util'
import DataItems from './validators/DataItems'
import DataItem from './validators/DataItem'
import DataItemRule, { RuleWithPayload } from './validators/DataItemRule'
import { Keys } from 'ts-toolbelt/out/Any/Keys'
import { MaybePromise, StaticRecord, ZodPartialObject } from './types'

export default class Data<
  DataValidators extends z.ZodRawShape,
  TargetingValidators extends z.ZodRawShape,
  QueryValidators extends z.ZodRawShape,
  ClientTargetingValidators extends z.ZodRawShape
> {
  readonly #clientTargetingValidators: ClientTargetingValidators
  readonly #data: z.infer<
    DataItems<DataValidators, TargetingValidators, ClientTargetingValidators>
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
      DataItems<DataValidators, TargetingValidators, ClientTargetingValidators>
    >,
    dataValidators: DataValidators,
    targetingPredicates: TargetingPredicates<
      TargetingValidators,
      QueryValidators
    >,
    targetingValidators: TargetingValidators,
    queryValidators: QueryValidators,
    clientTargetingValidators: ClientTargetingValidators
  ) {
    this.#clientTargetingValidators = Object.freeze(clientTargetingValidators)
    this.#data = Object.freeze(data)
    this.#dataValidators = Object.freeze(dataValidators)
    this.#targetingPredicates = Object.freeze(targetingPredicates)
    this.#targetingValidators = Object.freeze(targetingValidators)
    this.#queryValidators = Object.freeze(queryValidators)
    this.#QueryValidator = z.strictObject(this.#queryValidators).partial()
  }

  get data(): z.infer<
    DataItems<DataValidators, TargetingValidators, ClientTargetingValidators>
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

  get clientTargetingValidators() {
    return this.#clientTargetingValidators
  }

  useDataValidator<Name extends string, Validator extends z.ZodTypeAny>(
    name: Name,
    validator: Validator
  ) {
    return new Data<
      DataValidators & Record<Name, Validator>,
      TargetingValidators,
      QueryValidators,
      ClientTargetingValidators
    >(
      this.#data as z.infer<
        DataItems<
          DataValidators & Record<Name, Validator>,
          TargetingValidators,
          ClientTargetingValidators
        >
      >,
      {
        ...this.#dataValidators,
        [name]: validator,
      },
      this.#targetingPredicates,
      this.#targetingValidators,
      this.#queryValidators,
      this.#clientTargetingValidators
    )
  }

  insert(
    data: Partial<{
      [Name in keyof DataValidators]:
        | z.infer<DataValidators[Name]>
        | ClientRules<DataValidators[Name], TargetingValidators>
        | ClientRules<DataValidators[Name], ClientTargetingValidators>
    }>
  ) {
    return Object.entries(data).reduce<
      Data<
        DataValidators,
        TargetingValidators,
        QueryValidators,
        ClientTargetingValidators
      >
    >(
      (d, [key, value]) =>
        d.addRules(
          key as Keys<DataValidators>,
          this.#isClientRulesPayload(value)
            ? this.#isConsumableClientRulesPayload(value)
              ? value.__rules__
              : [{ client: value.__rules__ }]
            : [{ payload: value } as any]
        ),
      this
    )
  }

  #isClientRulesPayload<Name extends keyof DataValidators>(
    payload: Payload<z.infer<DataValidators[Name]>, TargetingValidators>
  ): payload is ClientRules<
    z.infer<DataValidators[Name]>,
    TargetingValidators
  > {
    return (
      typeof payload === 'object' && payload !== null && '__rules__' in payload
    )
  }

  #isConsumableClientRulesPayload<Name extends keyof DataValidators>(
    payload: ClientRules<z.infer<DataValidators[Name]>, TargetingValidators>
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
        ClientTargetingValidators
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
          this.#clientTargetingValidators
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
      this.#clientTargetingValidators
    )
  }

  removeAllRules() {
    return new Data(
      DataItems(
        this.#dataValidators,
        this.#targetingValidators,
        this.#clientTargetingValidators
      ).parse({}),
      this.#dataValidators,
      this.#targetingPredicates,
      this.#targetingValidators,
      this.#queryValidators,
      this.#clientTargetingValidators
    )
  }

  useTargeting<
    Name extends string,
    TV extends z.ZodTypeAny,
    QV extends z.ZodTypeAny
  >(name: Name, targetingDescriptor: TargetingDescriptor<TV, QV>) {
    type NewTargeting = TargetingValidators & { [K in Name]: TV }
    type NewQuery = QueryValidators & { [K in Name]: QV }
    return new Data<
      DataValidators,
      NewTargeting,
      NewQuery,
      ClientTargetingValidators
    >(
      this.#data as z.infer<
        DataItems<DataValidators, NewTargeting, ClientTargetingValidators>
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
      {
        ...this.#targetingValidators,
        [name]: targetingDescriptor.targetingValidator,
      },
      {
        ...this.#queryValidators,
        [name]: targetingDescriptor.queryValidator,
      },
      this.#clientTargetingValidators
    )
  }

  useClientTargeting<
    Name extends string,
    TV extends z.ZodTypeAny,
    QV extends z.ZodTypeAny
  >(name: Name, targetingValidator: TV | TargetingDescriptor<TV, QV>) {
    type NewClientTargeting = ClientTargetingValidators & { [K in Name]: TV }
    return new Data<
      DataValidators,
      TargetingValidators,
      QueryValidators,
      NewClientTargeting
    >(
      this.#data as z.infer<
        DataItems<DataValidators, TargetingValidators, NewClientTargeting>
      >,
      this.#dataValidators,
      this.#targetingPredicates,
      this.#targetingValidators,
      this.#queryValidators,
      {
        ...this.#clientTargetingValidators,
        [name]: isTargetingDescriptor(targetingValidator)
          ? targetingValidator.targetingValidator
          : targetingValidator,
      } as NewClientTargeting
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
        ClientTargetingValidators
      >
    >
  ) {
    return hasPayload(rule)
      ? rule.payload
      : 'client' in rule
      ? { __rules__: rule.client }
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
          ClientTargetingValidators
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
              ClientTargetingValidators
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

type ClientRules<P extends z.ZodTypeAny, T extends z.ZodRawShape> = {
  __rules__: z.infer<RuleWithPayload<P, T>>[]
}

type Payload<P extends z.ZodTypeAny, T extends z.ZodRawShape> =
  | z.infer<P>
  | ClientRules<P, T>
