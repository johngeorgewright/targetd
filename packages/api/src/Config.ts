import TargetingDescriptor from './validators/TargetingDescriptor'
import * as rt from 'runtypes'
import TargetingPredicates from './validators/TargetingPredicates'
import { objectEvery, objectMap } from './util'
import ConfigItems from './validators/ConfigItems'
import ConfigItem from './validators/ConfigItem'
import ConfigItemRule from './validators/ConfigItemRule'
import { Keys } from 'ts-toolbelt/out/Any/Keys'
import { StaticRecord } from './types'

export default class Config<
  DataValidators extends Record<string, rt.Runtype>,
  TargetingValidators extends Record<string, rt.Runtype>,
  QueryValidators extends Record<string, rt.Runtype>
> {
  readonly #data: rt.Static<ConfigItems<DataValidators, TargetingValidators>>
  readonly #dataValidators: DataValidators
  readonly #targetingPredicates: TargetingPredicates<
    TargetingValidators,
    QueryValidators
  >
  readonly #targetingValidators: TargetingValidators
  readonly #queryValidators: QueryValidators

  static create() {
    return new Config({}, {}, {}, {}, {})
  }

  private constructor(
    data: rt.Static<ConfigItems<DataValidators, TargetingValidators>>,
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
    return new Config<
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
    rules: rt.Static<
      ConfigItemRule<DataValidators[Name], TargetingValidators>
    >[]
  ) {
    const dataItem = (this.#data as any)[name] || {}
    return new Config(
      ConfigItems(this.#dataValidators, this.#targetingValidators).check({
        ...this.#data,
        [name]: {
          ...dataItem,
          rules: [...(dataItem.rules || []), ...rules],
        },
      }),
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
    return new Config<DataValidators, NewTargeting, NewQuery>(
      this.#data as any,
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

  getPayload(
    name: Keys<DataValidators>,
    rawQuery: Partial<StaticRecord<QueryValidators>>
  ) {
    const QueryValidators = rt.Partial(this.#queryValidators)
    const query = QueryValidators.check(rawQuery)

    const rules =
      (
        this.#data as Record<
          string,
          rt.Static<ConfigItem<rt.Unknown, TargetingValidators>>
        >
      )[name]?.rules || []

    const customPredicates = objectMap(
      this.#targetingPredicates,
      (target, targetingKey) => ({
        predicate: target.predicate(query[targetingKey]),
        requiresQuery: target.requiresQuery,
      })
    )

    const rule = rules.find(
      (rule) =>
        !rule.targeting ||
        this.#targetingPredicate(query, rule.targeting, customPredicates)
    )

    return (
      rule &&
      ('payload' in rule
        ? rule.payload
        : 'client' in rule
        ? { __rules__: rule.client }
        : undefined)
    )
  }

  #targetingPredicate(
    query: Partial<StaticRecord<QueryValidators>>,
    targeting: Partial<StaticRecord<TargetingValidators>>,
    customPredicates: Record<
      any,
      { predicate: (targeting: unknown) => boolean; requiresQuery: boolean }
    >
  ) {
    return objectEvery(targeting, (targetingKey) => {
      if (
        !(targetingKey in query) &&
        customPredicates[targetingKey]?.requiresQuery
      )
        return false

      if (targetingKey in customPredicates)
        return customPredicates[targetingKey].predicate(targeting[targetingKey])
      else console.warn(`Invalid targeting property ${targetingKey}`)

      return false
    })
  }
}
