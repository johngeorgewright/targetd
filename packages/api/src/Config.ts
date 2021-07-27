import ConfigItem from './types/ConfigItem'
import ConfigItemRule from './types/ConfigItemRule'
import TargetingPredicate from './types/TargetingPredicate'
import Query from './types/Query'
import { mapObject } from './util'
import TargetingDescriptor from './types/TargetingDescriptor'

export default class Config {
  #data: ConfigItem[]
  #predicates: Record<string, TargetingPredicate> = {}

  constructor(data: ConfigItem[]) {
    this.#data = data
  }

  usePredicate(targetingDescriptor: TargetingDescriptor) {
    this.#predicates[targetingDescriptor.name] = targetingDescriptor.predicate
  }

  getPayload(name: string, query: Query) {
    const rules = this.#data.reduce<ConfigItemRule[]>((rules, configItem) => {
      if (configItem.name === name) rules.push(...configItem.rules)
      return rules
    }, [])

    const targetingPredicate = this.#createTargetingPredicate(query)

    const rule = rules.find(
      (rule) => !rule.targeting || targetingPredicate(rule.targeting)
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

  #createTargetingPredicate: TargetingPredicate = (query) => {
    const customPredicates = mapObject(this.#predicates, (createPredicate) =>
      createPredicate(query)
    )

    const match = (x: string | number | boolean, y: boolean | any[]) =>
      typeof y === 'boolean' ? y === x : y.includes(x)

    return (targeting) =>
      Object.entries(targeting || {}).every(([targetingKey, targetingVal]) => {
        if (!(targetingKey in query)) return false
        if (targetingKey in customPredicates)
          return customPredicates[targetingKey](targeting)

        const queryValue = query[targetingKey]
        return Array.isArray(queryValue)
          ? queryValue.some((q) => match(q, targetingVal))
          : match(queryValue, targetingVal)
      })
  }
}
