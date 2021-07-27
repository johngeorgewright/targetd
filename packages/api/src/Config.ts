import ConfigItem from './types/ConfigItem'
import ConfigItemRule from './types/ConfigItemRule'
import Query from './types/Query'
import RulePredicate from './types/RulePredicate'

export default class Config {
  #data: ConfigItem[]
  #predicates = new Set<RulePredicate>()

  constructor(data: ConfigItem[]) {
    this.#data = data
  }

  usePredicate(targetingPrediate: RulePredicate) {
    this.#predicates.add(targetingPrediate)
  }

  getPayload(name: string, query: Query) {
    const predicates = [...this.#predicates].map((createPredicate) =>
      createPredicate(query)
    )

    const rules = this.#data.reduce<ConfigItemRule[]>((rules, configItem) => {
      if (configItem.name === name) rules.push(...configItem.rules)
      return rules
    }, [])

    const rule = rules.find((rule) =>
      predicates.every((predicate) => predicate(rule))
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
}
