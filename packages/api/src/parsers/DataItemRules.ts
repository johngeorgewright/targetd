import {
  DataItemRuleParser,
  RuleWithFallThroughParser,
  RuleWithPayloadParser,
} from './DataItemRule'
import { arrayLast, intersection, objectSize, someKeysIntersect } from '../util'
import deepEqual from 'fast-deep-equal'
import {
  type ZodTransformer,
  type ZodRawShape,
  type ZodTypeAny,
  type ZodArray,
  type output,
  type input,
} from 'zod'

export function DataItemRulesParser<
  P extends ZodTypeAny,
  T extends ZodRawShape,
  FTT extends ZodRawShape,
  Q extends ZodRawShape,
>(
  payloadParser: P,
  targetingParsers: T,
  fallThroughTargetingParsers: FTT,
  query: Q,
) {
  return RuleWithPayloadParser<P, T & FTT, Q>(
    payloadParser,
    {
      ...targetingParsers,
      ...fallThroughTargetingParsers,
    },
    query,
  )
    .array()
    .transform<output<DataItemRuleParser<P, T, FTT, Q, false>>[]>((rules) => {
      const singularTargetedRules = spreadMultiTargetsToSeparateRules(rules)

      let $rules: output<DataItemRuleParser<P, T, FTT, Q, false>>[] = []

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
            rule as output<DataItemRuleParser<P, T, FTT, Q, false>>,
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
    }) as DataItemRulesParser<P, T, FTT, Q>
}

export type DataItemRulesParser<
  Payload extends ZodTypeAny,
  Targeting extends ZodRawShape,
  FallThroughTargeting extends ZodRawShape,
  Query extends ZodRawShape,
> = ZodTransformer<
  ZodArray<
    RuleWithPayloadParser<Payload, Targeting & FallThroughTargeting, Query>
  >,
  output<
    ZodArray<
      DataItemRuleParser<Payload, Targeting, FallThroughTargeting, Query>
    >
  >,
  input<
    ZodArray<
      RuleWithPayloadParser<Payload, Targeting & FallThroughTargeting, Query>
    >
  >
>

function spreadMultiTargetsToSeparateRules<
  P extends ZodTypeAny,
  T extends ZodRawShape,
  FTT extends ZodRawShape,
  Q extends ZodRawShape,
>(rules: output<RuleWithPayloadParser<P, T & FTT, Q>>[]) {
  return rules.reduce<output<RuleWithPayloadParser<P, T & FTT, Q, false>>[]>(
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
          rule as output<RuleWithPayloadParser<P, T & FTT, Q, false>>,
        ]
      }
    },
    [],
  )
}

function canRulesCombine(
  targetingParsers: ZodRawShape,
  a: output<RuleWithPayloadParser<ZodTypeAny, ZodRawShape, ZodRawShape, false>>,
  b: output<RuleWithPayloadParser<ZodTypeAny, ZodRawShape, ZodRawShape, false>>,
) {
  const aTargeting = a.targeting
    ? intersection(a.targeting, targetingParsers)
    : {}

  const aTargetingKeys = Object.keys(aTargeting)

  const bTargeting = b.targeting
    ? intersection(b.targeting, targetingParsers)
    : {}

  const bTargetingKeys = Object.keys(bTargeting)

  return (
    deepEqual(aTargeting, bTargeting) &&
    (bTargetingKeys.length !== objectSize(b.targeting || {}) ||
      aTargetingKeys.length !== objectSize(a.targeting || {}))
  )
}

function adaptRule<
  P extends ZodTypeAny,
  T extends ZodRawShape,
  FTT extends ZodRawShape,
  Q extends ZodRawShape,
>(
  targetingParsers: T,
  fallThroughTargetingParsers: FTT,
  rule: output<RuleWithPayloadParser<P, T & FTT, Q, false>>,
) {
  return (
    someKeysIntersect(fallThroughTargetingParsers, rule.targeting || {})
      ? adaptRuleIntoFallThroughRule(
          targetingParsers,
          fallThroughTargetingParsers,
          rule as output<DataItemRuleParser<P, T, FTT, Q, false>>,
        )
      : rule
  ) as output<DataItemRuleParser<P, T, FTT, Q, false>>
}

function adaptRuleIntoFallThroughRule<
  P extends ZodTypeAny,
  T extends ZodRawShape,
  FTT extends ZodRawShape,
  Q extends ZodRawShape,
>(
  targetingParsers: T,
  fallThroughTargetingParsers: FTT,
  rule: output<DataItemRuleParser<P, T, FTT, Q, false>>,
): output<RuleWithFallThroughParser<P, T, FTT, Q, false>> {
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
  } as output<RuleWithFallThroughParser<P, T, FTT, Q, false>>
}
