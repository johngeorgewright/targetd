export { default as Data } from './Data'
export { DataItemParser } from './parsers/DataItem'
export { DataItemRuleParser } from './parsers/DataItemRule'
export { DataItemsParser } from './parsers/DataItems'
export { default as createTargetingDescriptor } from './createTargetingDescriptor'
export { default as TargetingDescriptor } from './parsers/TargetingDescriptor'
export { default as TargetingPredicate } from './parsers/TargetingPredicate'
export { default as TargetingPredicates } from './parsers/TargetingPredicates'
export { equalsPredicate, targetEquals } from './predicates/equals'
export {
  targetIncludesPredicate,
  targetIncludes,
} from './predicates/targetIncludes'
export type { StaticRecord } from './types'
export type { DT } from './types/Data'
export type { FTTT } from './types/FallThroughTargeting'
export type { PT } from './types/Payload'
export type { QT } from './types/Query'
export type { TT } from './types/Targeting'
