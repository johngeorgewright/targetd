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
>(payloadParser: P, targetingParsers: T, fallThroughTargetingParsers: FTT) {
  return RuleWithPayload<P, T & FTT>(payloadParser, {
    ...targetingParsers,
    ...fallThroughTargetingParsers,
  })
    .array()
    .transform<zInfer<DataItemRule<P, T, FTT, false>>[]>((rules) => {
      const singularTargetedRules = spreadMultiTargetsToSeparateRules(rules)

      let $rules: zInfer<DataItemRule<P, T, FTT, false>>[] = []

      for (const rule of singularTargetedRules) {
        const prevRule = arrayLast($rules)

        if (!prevRule) {
          $rules.push(
            adaptRule(targetingParsers, fallThroughTargetingParsers, rule),
          )
          continue
        }

        const thisRuleAndPrevRuleCanCombine = canRulesCombine(
          targetingParsers,
          prevRule,
          rule,
        )

        if (thisRuleAndPrevRuleCanCombine) {
          const adaptedPrevRule = adaptRuleIntoFallThroughRule(
            targetingParsers,
            fallThroughTargetingParsers,
            prevRule,
          )

          const adaptedRule = adaptRuleIntoFallThroughRule(
            targetingParsers,
            fallThroughTargetingParsers,
            rule as zInfer<DataItemRule<P, T, FTT, false>>,
          )

          adaptedPrevRule.fallThrough.push(...adaptedRule.fallThrough)

          $rules = [...$rules.slice(0, -1), adaptedPrevRule]
        } else {
          $rules.push(
            adaptRule(targetingParsers, fallThroughTargetingParsers, rule),
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
  targetingParsers: ZodRawShape,
  a: zInfer<RuleWithPayload<ZodTypeAny, ZodRawShape, false>>,
  b: zInfer<RuleWithPayload<ZodTypeAny, ZodRawShape, false>>,
) {
  const aTargetingKeys = a.targeting
    ? intersectionKeys(a.targeting, targetingParsers)
    : []

  const bTargetingKeys = b.targeting
    ? intersectionKeys(b.targeting, targetingParsers)
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
  targetingParsers: T,
  fallThroughTargetingParsers: FTT,
  rule: zInfer<RuleWithPayload<P, T & FTT, false>>,
) {
  return (
    someKeysIntersect(fallThroughTargetingParsers, rule.targeting || {})
      ? adaptRuleIntoFallThroughRule(
          targetingParsers,
          fallThroughTargetingParsers,
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
  targetingParsers: T,
  fallThroughTargetingParsers: FTT,
  rule: zInfer<DataItemRule<P, T, FTT, false>>,
): zInfer<RuleWithFallThrough<P, T, FTT, false>> {
  if ('fallThrough' in rule) return rule
  return {
    targeting: intersection(rule.targeting || {}, targetingParsers),
    fallThrough: [
      {
        payload: rule.payload,
        targeting: intersection(
          rule.targeting || {},
          fallThroughTargetingParsers,
        ),
      },
    ],
  } as zInfer<RuleWithFallThrough<P, T, FTT, false>>
}
