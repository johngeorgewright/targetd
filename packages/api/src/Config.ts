import Query from './types/Query'
import TargetingDescriptor from './types/TargetingDescriptor'
import * as rt from 'runtypes'
import TargetingPredicates from './types/TargetingPredicates'
import { objectEvery, objectMap } from './util'
import ConfigItems from './types/ConfigItems'
import ConfigItem from './types/ConfigItem'
import ConfigItemRule from './types/ConfigItemRule'

export default class Config<
  Data extends Record<string, rt.Runtype>,
  Targeting extends rt.Record<any, any>
> {
  readonly #data: rt.Static<ConfigItems<Data, Targeting>>
  readonly #dataValidators: Data
  readonly #predicates: TargetingPredicates<Targeting>
  readonly #targetingValidator: Targeting

  static create() {
    return new Config(
      {},
      {},
      {} as TargetingPredicates<rt.Record<{}, false>>,
      rt.Record({})
    )
  }

  private constructor(
    data: rt.Static<ConfigItems<Data, Targeting>>,
    dataValidators: Data,
    predicates: TargetingPredicates<Targeting>,
    targetingValidator: Targeting
  ) {
    this.#data = data
    this.#dataValidators = dataValidators
    this.#predicates = predicates
    this.#targetingValidator = targetingValidator
  }

  useDataValidator<Name extends string, Validator extends rt.Runtype>(
    name: Name,
    validator: Validator
  ) {
    return new Config<Data & Record<Name, Validator>, Targeting>(
      this.#data,
      {
        ...this.#dataValidators,
        [name]: validator,
      },
      this.#predicates,
      this.#targetingValidator
    )
  }

  addRules<Name extends keyof Data>(
    name: Name,
    rules: rt.Static<ConfigItemRule<Data[Name], Targeting>>[]
  ) {
    const dataItem = (this.#data as any)[name] || { rules: [] }
    dataItem.rules.push(...rules)
    return new Config(
      ConfigItems(this.#dataValidators, this.#targetingValidator).check({
        ...this.#data,
        [name]: dataItem,
      }),
      this.#dataValidators,
      this.#predicates,
      this.#targetingValidator
    )
  }

  usePredicate<Name extends string, R extends rt.Runtype>(
    targetingDescriptor: TargetingDescriptor<Name, R>
  ) {
    type NewTargeting = rt.Record<
      Targeting['fields'] & Record<Name, rt.Optional<R>>,
      false
    >

    return new Config(
      this.#data as rt.Static<ConfigItems<Data, NewTargeting>>,
      this.#dataValidators,
      {
        ...this.#predicates,
        [targetingDescriptor.name]: targetingDescriptor.predicate,
      },
      rt.Record({
        ...this.#targetingValidator.fields,
        [targetingDescriptor.name]: targetingDescriptor.runtype.optional(),
      })
    )
  }

  getPayload(name: string, query: Query) {
    const rules =
      (
        this.#data as Record<
          string,
          rt.Static<ConfigItem<rt.Unknown, Targeting>>
        >
      )[name]?.rules || []

    const customPredicates = objectMap(this.#predicates, (createPredicate) =>
      createPredicate(query)
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
    query: Query,
    targeting: rt.Static<Targeting>,
    customPredicates: Record<
      keyof Targeting,
      (targeting: Record<keyof Targeting, unknown>) => boolean
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
