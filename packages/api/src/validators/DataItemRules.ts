import DataItemRule, {
  RuleWithFallThrough,
  RuleWithPayload,
} from './DataItemRule'
import {
  arrayLast,
  intersection,
  intersectionKeys,
  objectSize,
  someKeysIntersect,
} from '../util'
import {
  type ZodTransformer,
  type infer as zInfer,
  type ZodRawShape,
  type ZodTypeAny,
  type ZodArray,
} from 'zod'

function DataItemRules<
  P extends ZodTypeAny,
  T extends ZodRawShape,
  FTT extends ZodRawShape,
>(
  payloadValidator: P,
  targetingValidators: T,
  fallThroughTargetingValidators: FTT,
) {
  return RuleWithPayload<P, T & FTT>(payloadValidator, {
    ...targetingValidators,
    ...fallThroughTargetingValidators,
  })
    .array()
    .transform<zInfer<DataItemRule<P, T, FTT, false>>[]>((rules) => {
      const singularTargetedRules = spreadMultiTargetsToSeparateRules(rules)

      let $rules: zInfer<DataItemRule<P, T, FTT, false>>[] = []

      for (const rule of singularTargetedRules) {
        const prevRule = arrayLast($rules)

        if (!prevRule) {
          $rules.push(
            adaptRule(
              targetingValidators,
              fallThroughTargetingValidators,
              rule,
            ),
          )
          continue
        }

        const thisRuleAndPrevRuleCanCombine = canRulesCombine(
          targetingValidators,
          prevRule,
          rule,
        )

        if (thisRuleAndPrevRuleCanCombine) {
          const adaptedPrevRule = adaptRuleIntoFallThroughRule(
            targetingValidators,
            fallThroughTargetingValidators,
            prevRule,
          )

          const adaptedRule = adaptRuleIntoFallThroughRule(
            targetingValidators,
            fallThroughTargetingValidators,
            rule as zInfer<DataItemRule<P, T, FTT, false>>,
          )

          adaptedPrevRule.fallThrough.push(...adaptedRule.fallThrough)

          $rules = [...$rules.slice(0, -1), adaptedPrevRule]
        } else {
          $rules.push(
            adaptRule(
              targetingValidators,
              fallThroughTargetingValidators,
              rule,
            ),
          )
        }
      }

      return $rules
    }) as DataItemRules<P, T, FTT>
}

type DataItemRules<
  Payload extends ZodTypeAny,
  Targeting extends ZodRawShape,
  FallThroughTargeting extends ZodRawShape,
> = ZodTransformer<
  ZodArray<RuleWithPayload<Payload, Targeting & FallThroughTargeting>>,
  zInfer<ZodArray<DataItemRule<Payload, Targeting, FallThroughTargeting>>>,
  zInfer<ZodArray<RuleWithPayload<Payload, Targeting & FallThroughTargeting>>>
>

export default DataItemRules

function spreadMultiTargetsToSeparateRules<
  P extends ZodTypeAny,
  T extends ZodRawShape,
  FTT extends ZodRawShape,
>(rules: zInfer<RuleWithPayload<P, T & FTT>>[]) {
  return rules.reduce<zInfer<RuleWithPayload<P, T & FTT, false>>[]>(
    (rules, rule) => {
      if (Array.isArray(rule.targeting)) {
        for (const targeting of rule.targeting) {
          rules.push({
            payload: rule.payload,
            targeting,
          })
        }
        return rules
      } else {
        return [...rules, rule as zInfer<RuleWithPayload<P, T & FTT, false>>]
      }
    },
    [],
  )
}

function canRulesCombine(
  targetingValidators: ZodRawShape,
  a: zInfer<RuleWithPayload<ZodTypeAny, ZodRawShape, false>>,
  b: zInfer<RuleWithPayload<ZodTypeAny, ZodRawShape, false>>,
) {
  const aTargetingKeys = a.targeting
    ? intersectionKeys(a.targeting, targetingValidators)
    : []

  const bTargetingKeys = b.targeting
    ? intersectionKeys(b.targeting, targetingValidators)
    : []

  return (
    aTargetingKeys.every((key) => bTargetingKeys.includes(key)) &&
    (bTargetingKeys.length !== objectSize(b.targeting || {}) ||
      aTargetingKeys.length !== objectSize(a.targeting || {}))
  )
}

function adaptRule<
  P extends ZodTypeAny,
  T extends ZodRawShape,
  FTT extends ZodRawShape,
>(
  targetingValidators: T,
  fallThroughTargetingValidators: FTT,
  rule: zInfer<RuleWithPayload<P, T & FTT, false>>,
) {
  return (
    someKeysIntersect(fallThroughTargetingValidators, rule.targeting || {})
      ? adaptRuleIntoFallThroughRule(
          targetingValidators,
          fallThroughTargetingValidators,
          rule as zInfer<DataItemRule<P, T, FTT, false>>,
        )
      : rule
  ) as zInfer<DataItemRule<P, T, FTT, false>>
}

function adaptRuleIntoFallThroughRule<
  P extends ZodTypeAny,
  T extends ZodRawShape,
  FTT extends ZodRawShape,
>(
  targetingValidators: T,
  fallThroughTargetingValidators: FTT,
  rule: zInfer<DataItemRule<P, T, FTT, false>>,
): zInfer<RuleWithFallThrough<P, T, FTT, false>> {
  if ('fallThrough' in rule) return rule
  return {
    targeting: intersection(rule.targeting || {}, targetingValidators),
    fallThrough: [
      {
        payload: rule.payload,
        targeting: intersection(
          rule.targeting || {},
          fallThroughTargetingValidators,
        ),
      },
    ],
  } as zInfer<RuleWithFallThrough<P, T, FTT, false>>
}
