export { default as Data } from './Data.ts'
export { DataItemParser } from './parsers/DataItem.ts'
export { DataItemRuleParser } from './parsers/DataItemRule.ts'
export { DataItemsParser } from './parsers/DataItems.ts'
export { default as createTargetingDescriptor } from './createTargetingDescriptor.ts'
export type { default as TargetingDescriptor } from './parsers/TargetingDescriptor.ts'
export type { default as TargetingPredicate } from './parsers/TargetingPredicate.ts'
export type { default as TargetingPredicates } from './parsers/TargetingPredicates.ts'
export { equalsPredicate, targetEquals } from './predicates/equals.ts'
export {
  targetIncludes,
  targetIncludesPredicate,
} from './predicates/targetIncludes.ts'
export type { StaticRecord } from './types.ts'
export type * as DT from './types/Data.ts'
export type * as FTTT from './types/FallThroughTargeting.ts'
export type * as PT from './types/Payload.ts'
export type * as QT from './types/Query.ts'
export type * as TT from './types/Targeting.ts'
