import ConfigItemRule from './ConfigItemRule'
import Query from './Query'

type RulePredicate = (query: Query) => (rule: ConfigItemRule) => boolean
export default RulePredicate
