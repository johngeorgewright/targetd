import z from 'zod'
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

function DataItemRules<
  P extends z.ZodTypeAny,
  T extends z.ZodRawShape,
  FTT extends z.ZodRawShape
>(
  payloadValidator: P,
  targetingValidators: T,
  fallThroughTargetingValidators: FTT
): DataItemRules<P, T, FTT> {
  return RuleWithPayload<P, T & FTT>(payloadValidator, {
    ...targetingValidators,
    ...fallThroughTargetingValidators,
  })
    .array()
    .transform<z.infer<DataItemRule<P, T, FTT, false>>[]>((rules) => {
      const singularTargetedRules = spreadMultiTargetsToSeparateRules(rules)

      let $rules: z.infer<DataItemRule<P, T, FTT, false>>[] = []

      for (const rule of singularTargetedRules) {
        const prevRule = arrayLast($rules)

        if (!prevRule) {
          $rules.push(
            adaptRule(targetingValidators, fallThroughTargetingValidators, rule)
          )
          continue
        }

        const thisRuleAndPrevRuleCanCombine = canRulesCombine(
          targetingValidators,
          prevRule,
          rule
        )

        if (thisRuleAndPrevRuleCanCombine) {
          const adaptedPrevRule = adaptRuleIntoFallThroughRule(
            targetingValidators,
            fallThroughTargetingValidators,
            prevRule
          )

          const adaptedRule = adaptRuleIntoFallThroughRule(
            targetingValidators,
            fallThroughTargetingValidators,
            rule as z.infer<DataItemRule<P, T, FTT, false>>
          )

          adaptedPrevRule.fallThrough.push(...adaptedRule.fallThrough)

          $rules = [...$rules.slice(0, -1), adaptedPrevRule]
        } else {
          $rules.push(
            adaptRule(targetingValidators, fallThroughTargetingValidators, rule)
          )
        }
      }

      return $rules
    }) as DataItemRules<P, T, FTT>
}

type DataItemRules<
  Payload extends z.ZodTypeAny,
  Targeting extends z.ZodRawShape,
  FallThroughTargeting extends z.ZodRawShape
> = z.ZodTransformer<
  z.ZodArray<RuleWithPayload<Payload, Targeting & FallThroughTargeting>>,
  z.infer<z.ZodArray<DataItemRule<Payload, Targeting, FallThroughTargeting>>>,
  z.infer<
    z.ZodArray<RuleWithPayload<Payload, Targeting & FallThroughTargeting>>
  >
>

export default DataItemRules

function spreadMultiTargetsToSeparateRules<
  P extends z.ZodTypeAny,
  T extends z.ZodRawShape,
  FTT extends z.ZodRawShape
>(rules: z.infer<RuleWithPayload<P, T & FTT>>[]) {
  return rules.reduce<z.infer<RuleWithPayload<P, T & FTT, false>>[]>(
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
        return [...rules, rule as z.infer<RuleWithPayload<P, T & FTT, false>>]
      }
    },
    []
  )
}

function canRulesCombine(
  targetingValidators: z.ZodRawShape,
  a: z.infer<RuleWithPayload<z.ZodTypeAny, z.ZodRawShape, false>>,
  b: z.infer<RuleWithPayload<z.ZodTypeAny, z.ZodRawShape, false>>
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
  P extends z.ZodTypeAny,
  T extends z.ZodRawShape,
  FTT extends z.ZodRawShape
>(
  targetingValidators: T,
  fallThroughTargetingValidators: FTT,
  rule: z.infer<RuleWithPayload<P, T & FTT, false>>
): z.infer<DataItemRule<P, T, FTT, false>> {
  return (
    someKeysIntersect(fallThroughTargetingValidators, rule.targeting || {})
      ? adaptRuleIntoFallThroughRule(
          targetingValidators,
          fallThroughTargetingValidators,
          rule as z.infer<DataItemRule<P, T, FTT, false>>
        )
      : rule
  ) as z.infer<DataItemRule<P, T, FTT, false>>
}

function adaptRuleIntoFallThroughRule<
  P extends z.ZodTypeAny,
  T extends z.ZodRawShape,
  FTT extends z.ZodRawShape
>(
  targetingValidators: T,
  fallThroughTargetingValidators: FTT,
  rule: z.infer<DataItemRule<P, T, FTT, false>>
): z.infer<RuleWithFallThrough<P, T, FTT, false>> {
  if ('fallThrough' in rule) return rule
  return {
    targeting: intersection(rule.targeting || {}, targetingValidators),
    fallThrough: [
      {
        payload: rule.payload,
        targeting: intersection(
          rule.targeting || {},
          fallThroughTargetingValidators
        ),
      },
    ],
  } as z.infer<RuleWithFallThrough<P, T, FTT, false>>
}
