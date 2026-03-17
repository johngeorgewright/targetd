export { default as Data } from './Data.js'
export * from './PromisedData.js'
export { DataItemParser } from './parsers/DataItem.js'
export { DataItemsParser } from './parsers/DataItems.js'
export { DataItemRuleParser } from './parsers/DataItemRule.js'
export { DataItemRulesParser } from './parsers/DataItemRules.js'
export * from './parsers/switch.js'
export { default as createTargetingDescriptor } from './createTargetingDescriptor.js'
export type { default as TargetingDescriptor } from './parsers/TargetingDescriptor.js'
export type { default as TargetingPredicate } from './parsers/TargetingPredicate.js'
export type { default as TargetingPredicates } from './parsers/TargetingPredicates.js'
export { targetEquals } from './predicates/equals.js'
export { targetIncludes } from './predicates/targetIncludes.js'
export type { StaticRecord } from './types.js'

/**
 * Type helpers for the {@link Data} class.
 */
export type * as DT from './types/Data.js'

/**
 * Type helers for fallthrough-targeting
 */
export type * as FTTT from './types/FallThroughTargeting.js'

/**
 * Type helers for payloads
 */
export type * as PT from './types/Payload.js'

/**
 * Type helpers for queries
 */
export type * as QT from './types/Query.js'

/**
 * Type helpers for targeting
 */
export type * as TT from './types/Targeting.js'
