import type { RulePredicate } from '@config/api'

const targetingPredicate: RulePredicate = (query) => (rule) =>
  Object.entries(rule.targeting || {}).every(([targetingKey, targetingVal]) => {
    if (!(targetingKey in query)) return false
    const queryValue = query[targetingKey]
    return Array.isArray(queryValue)
      ? queryValue.some((q) => match(q, targetingVal))
      : match(queryValue, targetingVal)
  })

export default targetingPredicate

function match(x: string | number | boolean, y: boolean | any[]) {
  return typeof y === 'boolean' ? y === x : y.includes(x)
}
