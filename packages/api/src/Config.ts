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
  Data extends Record<string, rt.Runtype>,
  Targeting extends Record<string, rt.Runtype>,
  Query extends Record<Keys<Targeting>, rt.Runtype>
> {
  readonly #data: rt.Static<ConfigItems<Data, Targeting>>
  readonly #dataValidators: Data
  readonly #predicates: TargetingPredicates<Targeting, Query>
  readonly #targetingValidators: Targeting
  readonly #queryValidators: Query

  static create() {
    return new Config({}, {}, {}, {}, {})
  }

  private constructor(
    data: rt.Static<ConfigItems<Data, Targeting>>,
    dataValidators: Data,
    predicates: TargetingPredicates<Targeting, Query>,
    targetingValidators: Targeting,
    queryValidators: Query
  ) {
    this.#data = data
    this.#dataValidators = dataValidators
    this.#predicates = predicates
    this.#targetingValidators = targetingValidators
    this.#queryValidators = queryValidators
  }

  useDataValidator<Name extends string, Validator extends rt.Runtype>(
    name: Name,
    validator: Validator
  ) {
    return new Config<Data & Record<Name, Validator>, Targeting, Query>(
      this.#data,
      {
        ...this.#dataValidators,
        [name]: validator,
      },
      this.#predicates,
      this.#targetingValidators,
      this.#queryValidators
    )
  }

  addRules<Name extends Keys<Data>>(
    name: Name,
    rules: rt.Static<ConfigItemRule<Data[Name], Targeting>>[]
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
      this.#predicates,
      this.#targetingValidators,
      this.#queryValidators
    )
  }

  usePredicate<
    Name extends string,
    TV extends rt.Runtype,
    QV extends rt.Runtype
  >(targetingDescriptor: TargetingDescriptor<Name, TV, QV>) {
    type NewTargeting = Targeting & Record<Name, TV>
    type NewQuery = Query & Record<Keys<NewTargeting>, QV>
    return new Config(
      this.#data as any,
      this.#dataValidators,
      {
        ...this.#predicates,
        [targetingDescriptor.name]: targetingDescriptor.predicate,
      } as TargetingPredicates<NewTargeting, NewQuery>,
      {
        ...this.#targetingValidators,
        [targetingDescriptor.name]: targetingDescriptor.validator,
      } as NewTargeting,
      {
        ...this.#queryValidators,
        [targetingDescriptor.name]: targetingDescriptor.queryValidator,
      } as NewQuery
    )
  }

  getPayload(name: Keys<Data>, rawQuery: StaticRecord<Query>) {
    const Query = rt.Partial(this.#queryValidators)
    const query = Query.check(rawQuery)

    const rules =
      (
        this.#data as Record<
          string,
          rt.Static<ConfigItem<rt.Unknown, Targeting>>
        >
      )[name]?.rules || []

    const customPredicates = objectMap(this.#predicates, (createPredicate) =>
      createPredicate(query as any)
    )

    const rule = rules.find(
      (rule) =>
        !rule.targeting ||
        this.#targetingPredicate(
          query as any,
          rule.targeting as any,
          customPredicates
        )
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
    query: StaticRecord<Query>,
    targeting: StaticRecord<Targeting>,
    customPredicates: Record<
      any,
      (targeting: Record<string, unknown>) => boolean
    >
  ) {
    return objectEvery(targeting, (targetingKey) => {
      if (!(targetingKey in query)) return false

      if (targetingKey in customPredicates)
        return customPredicates[targetingKey](targeting as any)
      else console.warn(`Invalid targeting property ${targetingKey}`)

      return false
    })
  }
}
