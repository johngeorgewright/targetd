import { cast as castArray } from '@johngw/array'
import Query from './types/Query'
import TargetingDescriptor from './types/TargetingDescriptor'
import * as rt from 'runtypes'
import TargetingPredicates from './types/TargetingPredicates'
import { objectEvery, objectMap } from './util'
import ConfigItems from './types/ConfigItems'
import ConfigItemRule from './types/ConfigItemRule'
import ConfigItem from './types/ConfigItem'

export default class Config<Targeting extends rt.Record<any, any>> {
  readonly #data: rt.Static<ConfigItems<Targeting>>
  readonly #predicates: TargetingPredicates<Targeting>
  readonly #validator: ConfigItems<Targeting>

  static create() {
    return new Config(
      [],
      {} as TargetingPredicates<rt.Record<{}, false>>,
      ConfigItems(rt.Record({}))
    )
  }

  private constructor(
    data: rt.Static<ConfigItems<Targeting>>,
    predicates: TargetingPredicates<Targeting>,
    validator: ConfigItems<Targeting>
  ) {
    this.#data = data
    this.#predicates = predicates
    this.#validator = validator
  }

  add(
    data: rt.Static<ConfigItems<Targeting>> | rt.Static<ConfigItem<Targeting>>
  ) {
    return new Config(
      this.#validator.check([...this.#data, ...castArray(data)]),
      this.#predicates,
      this.#validator
    )
  }

  usePredicate<Name extends string, R extends rt.Runtype>(
    targetingDescriptor: TargetingDescriptor<Name, R>
  ) {
    let targeting =
      this.#validator.element.fields.rules.element.alternatives[0].fields
        .targeting?.underlying

    type NewTargeting = rt.Record<
      Targeting['fields'] & Record<Name, rt.Optional<R>>,
      false
    >

    const newTargeting: NewTargeting = rt.Record({
      ...targeting.fields,
      [targetingDescriptor.name]: targetingDescriptor.runtype.optional(),
    })

    return new Config(
      this.#data as rt.Static<ConfigItems<NewTargeting>>,
      {
        ...this.#predicates,
        [targetingDescriptor.name]: targetingDescriptor.predicate,
      },
      ConfigItems(newTargeting)
    )
  }

  getPayload(name: string, query: Query) {
    type Rules = rt.Static<ConfigItemRule<Targeting>>[]

    const rules = this.#data.reduce<Rules>((rules, configItem) => {
      if (configItem.name === name) rules.push(...configItem.rules)
      return rules
    }, [])

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
