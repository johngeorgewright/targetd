import {
  DataItemRuleParser,
  RuleWithFallThroughParser,
  RuleWithPayloadParser,
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

export function DataItemRulesParser<
  P extends ZodTypeAny,
  T extends ZodRawShape,
  FTT extends ZodRawShape,
>(payloadParser: P, targetingParsers: T, fallThroughTargetingParsers: FTT) {
  return RuleWithPayloadParser<P, T & FTT>(payloadParser, {
    ...targetingParsers,
    ...fallThroughTargetingParsers,
  })
    .array()
    .transform<zInfer<DataItemRuleParser<P, T, FTT, false>>[]>((rules) => {
      const singularTargetedRules = spreadMultiTargetsToSeparateRules(rules)

      let $rules: zInfer<DataItemRuleParser<P, T, FTT, false>>[] = []

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
            rule as zInfer<DataItemRuleParser<P, T, FTT, false>>,
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
    }) as DataItemRulesParser<P, T, FTT>
}

export type DataItemRulesParser<
  Payload extends ZodTypeAny,
  Targeting extends ZodRawShape,
  FallThroughTargeting extends ZodRawShape,
> = ZodTransformer<
  ZodArray<RuleWithPayloadParser<Payload, Targeting & FallThroughTargeting>>,
  zInfer<
    ZodArray<DataItemRuleParser<Payload, Targeting, FallThroughTargeting>>
  >,
  zInfer<
    ZodArray<RuleWithPayloadParser<Payload, Targeting & FallThroughTargeting>>
  >
>

function spreadMultiTargetsToSeparateRules<
  P extends ZodTypeAny,
  T extends ZodRawShape,
  FTT extends ZodRawShape,
>(rules: zInfer<RuleWithPayloadParser<P, T & FTT>>[]) {
  return rules.reduce<zInfer<RuleWithPayloadParser<P, T & FTT, false>>[]>(
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
        return [
          ...rules,
          rule as zInfer<RuleWithPayloadParser<P, T & FTT, false>>,
        ]
      }
    },
    [],
  )
}

function canRulesCombine(
  targetingParsers: ZodRawShape,
  a: zInfer<RuleWithPayloadParser<ZodTypeAny, ZodRawShape, false>>,
  b: zInfer<RuleWithPayloadParser<ZodTypeAny, ZodRawShape, false>>,
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
  rule: zInfer<RuleWithPayloadParser<P, T & FTT, false>>,
) {
  return (
    someKeysIntersect(fallThroughTargetingParsers, rule.targeting || {})
      ? adaptRuleIntoFallThroughRule(
          targetingParsers,
          fallThroughTargetingParsers,
          rule as zInfer<DataItemRuleParser<P, T, FTT, false>>,
        )
      : rule
  ) as zInfer<DataItemRuleParser<P, T, FTT, false>>
}

function adaptRuleIntoFallThroughRule<
  P extends ZodTypeAny,
  T extends ZodRawShape,
  FTT extends ZodRawShape,
>(
  targetingParsers: T,
  fallThroughTargetingParsers: FTT,
  rule: zInfer<DataItemRuleParser<P, T, FTT, false>>,
): zInfer<RuleWithFallThroughParser<P, T, FTT, false>> {
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
  } as zInfer<RuleWithFallThroughParser<P, T, FTT, false>>
}
