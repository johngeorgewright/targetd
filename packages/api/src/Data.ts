import TargetingDescriptor from './validators/TargetingDescriptor'
import * as rt from 'runtypes'
import TargetingPredicates from './validators/TargetingPredicates'
import { objectEveryAsync, objectMap } from './util'
import DataItems from './validators/DataItems'
import DataItem from './validators/DataItem'
import DataItemRule, { RuleWithPayload } from './validators/DataItemRule'
import { Keys } from 'ts-toolbelt/out/Any/Keys'
import { MaybePromise, StaticRecord } from './types'

export default class Data<
  DataValidators extends Record<string, rt.Runtype>,
  TargetingValidators extends Record<string, rt.Runtype>,
  QueryValidators extends Record<string, rt.Runtype>
> {
  readonly #data: rt.Static<DataItems<DataValidators, TargetingValidators>>
  readonly #dataValidators: DataValidators
  readonly #targetingPredicates: TargetingPredicates<
    TargetingValidators,
    QueryValidators
  >
  readonly #targetingValidators: TargetingValidators
  readonly #queryValidators: QueryValidators

  static create() {
    return new Data({}, {}, {}, {}, {})
  }

  private constructor(
    data: rt.Static<DataItems<DataValidators, TargetingValidators>>,
    dataValidators: DataValidators,
    targetingPredicates: TargetingPredicates<
      TargetingValidators,
      QueryValidators
    >,
    targetingValidators: TargetingValidators,
    queryValidators: QueryValidators
  ) {
    this.#data = data
    this.#dataValidators = dataValidators
    this.#targetingPredicates = targetingPredicates
    this.#targetingValidators = targetingValidators
    this.#queryValidators = queryValidators
  }

  useDataValidator<Name extends string, Validator extends rt.Runtype>(
    name: Name,
    validator: Validator
  ) {
    return new Data<
      DataValidators & Record<Name, Validator>,
      TargetingValidators,
      QueryValidators
    >(
      this.#data,
      {
        ...this.#dataValidators,
        [name]: validator,
      },
      this.#targetingPredicates,
      this.#targetingValidators,
      this.#queryValidators
    )
  }

  addRules<Name extends Keys<DataValidators>>(
    name: Name,
    rules: rt.Static<DataItemRule<DataValidators[Name], TargetingValidators>>[]
  ) {
    const dataItem = (this.#data as any)[name] || {}
    return new Data(
      {
        ...this.#data,
        ...DataItems(this.#dataValidators, this.#targetingValidators).check({
          [name]: {
            ...dataItem,
            rules: [...(dataItem.rules || []), ...rules],
          },
        }),
      },
      this.#dataValidators,
      this.#targetingPredicates,
      this.#targetingValidators,
      this.#queryValidators
    )
  }

  useTargeting<
    Name extends string,
    TV extends rt.Runtype,
    QV extends rt.Runtype
  >(name: Name, targetingDescriptor: TargetingDescriptor<TV, QV>) {
    type NewTargeting = TargetingValidators & { [K in Name]: TV }
    type NewQuery = QueryValidators & { [K in Name]: QV }
    return new Data<DataValidators, NewTargeting, NewQuery>(
      this.#data,
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
      } as any
    )
  }

  async getPayloadForEachName(
    rawQuery: Partial<StaticRecord<QueryValidators>>
  ) {
    const payloads = {} as {
      [Name in keyof DataValidators]:
        | Payload<DataValidators[Name], TargetingValidators>
        | undefined
    }

    await Promise.all(
      Object.keys(this.#data).map(async (name) => {
        payloads[name as keyof DataValidators] = await this.getPayload(
          name,
          rawQuery
        )
      })
    )

    return payloads
  }

  async getPayload<Name extends keyof DataValidators>(
    name: Name,
    rawQuery: Partial<StaticRecord<QueryValidators>>
  ): Promise<Payload<DataValidators[Name], TargetingValidators> | void> {
    const predicate = this.#createRulePredicate(rawQuery)
    for (const rule of this.#getTargetableRules(name))
      if (await predicate(rule)) return this.#mapRule(rule)
  }

  async getPayloads<Name extends keyof DataValidators>(
    name: Name,
    rawQuery: Partial<StaticRecord<QueryValidators>>
  ): Promise<Payload<DataValidators[Name], TargetingValidators>[]> {
    const payloads: Payload<DataValidators[Name], TargetingValidators>[] = []
    const predicate = this.#createRulePredicate(rawQuery)
    for (const rule of this.#getTargetableRules(name))
      if (await predicate(rule)) payloads.push(this.#mapRule(rule))
    return payloads
  }

  readonly #mapRule = <Name extends keyof DataValidators>(
    rule: rt.Static<DataItemRule<DataValidators[Name], TargetingValidators>>
  ) =>
    hasPayload(rule)
      ? rule.payload
      : 'client' in rule
      ? { __rules__: rule.client }
      : undefined

  #createRulePredicate<Name extends keyof DataValidators>(
    rawQuery: Partial<StaticRecord<QueryValidators>>
  ) {
    const QueryValidators = rt.Partial(this.#queryValidators)
    const query = QueryValidators.check(rawQuery)

    const targeting = objectMap(
      this.#targetingPredicates,
      (target, targetingKey) => ({
        predicate: target.predicate(query[targetingKey]),
        requiresQuery: target.requiresQuery,
      })
    )

    return (
      rule: rt.Static<DataItemRule<DataValidators[Name], TargetingValidators>>
    ) =>
      !('targeting' in rule) ||
      this.#targetingPredicate(query, rule.targeting!, targeting)
  }

  #getTargetableRules<Name extends keyof DataValidators>(name: Name) {
    return (
      (
        this.#data as unknown as {
          [Name in keyof DataValidators]: rt.Static<
            DataItem<DataValidators[Name], TargetingValidators>
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
    return objectEveryAsync(targeting, async (targetingKey) => {
      if (!(targetingKey in query) && predicates[targetingKey]?.requiresQuery)
        return false

      if (targetingKey in predicates)
        return (await predicates[targetingKey].predicate)(
          targeting[targetingKey]
        )
      else console.warn(`Invalid targeting property ${String(targetingKey)}`)

      return false
    })
  }
}

function hasPayload<Payload>(x: any): x is { payload: Payload } {
  return 'payload' in x
}

type ClientRules<P extends rt.Runtype, T extends Record<string, rt.Runtype>> = {
  __rules__: rt.Static<RuleWithPayload<P, T>>[]
}

type Payload<P extends rt.Runtype, T extends Record<string, rt.Runtype>> =
  | rt.Static<P>
  | ClientRules<P, T>
