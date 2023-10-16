import z from 'zod'
import DataItemRule, {
  RuleWithFallThrough,
  RuleWithPayload,
} from './DataItemRule'
import {
  arrayLast,
  objectFitler,
  objectKeys,
  objectSize,
  objectSome,
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
    .transform<z.infer<DataItemRule<P, T, FTT>>[]>((rules) => {
      let $rules: z.infer<DataItemRule<P, T, FTT>>[] = []

      for (const rule of rules) {
        const prevRule = arrayLast($rules)

        if (!prevRule) {
          $rules.push(
            adaptRule(targetingValidators, fallThroughTargetingValidators, rule)
          )
          continue
        }

        const prevTargeting = prevRule.targeting
          ? objectKeys(filterTargeting(targetingValidators, prevRule.targeting))
          : []

        const targeting = rule.targeting
          ? objectKeys(filterTargeting(targetingValidators, rule.targeting))
          : []

        const matchesFallThroughRule =
          prevTargeting.every((key) => targeting.includes(key)) &&
          (targeting.length !== objectSize(rule.targeting || {}) ||
            prevTargeting.length !== objectSize(prevRule.targeting || {}))

        if (matchesFallThroughRule) {
          const adaptedLastRule = adaptRuleIntoFallThroughRule(
            targetingValidators,
            fallThroughTargetingValidators,
            prevRule
          )

          const adaptedRule = adaptRuleIntoFallThroughRule(
            targetingValidators,
            fallThroughTargetingValidators,
            rule as z.infer<DataItemRule<P, T, FTT>>
          )

          adaptedLastRule.fallThrough.push(...adaptedRule.fallThrough)

          $rules = [...$rules.slice(0, -1), adaptedLastRule]
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

function filterTargeting(
  targetingValidators: z.ZodRawShape,
  targeting: Record<string, unknown>
) {
  return objectFitler(targeting, (_, name) => name in targetingValidators)
}

function adaptRule<
  P extends z.ZodTypeAny,
  T extends z.ZodRawShape,
  FTT extends z.ZodRawShape
>(
  targetingValidators: T,
  fallThroughTargetingValidators: FTT,
  rule: z.infer<RuleWithPayload<P, T & FTT>>
): z.infer<DataItemRule<P, T, FTT>> {
  return (
    objectSome(
      fallThroughTargetingValidators,
      (_, name) => name in (rule.targeting || {})
    )
      ? adaptRuleIntoFallThroughRule(
          targetingValidators,
          fallThroughTargetingValidators,
          rule as z.infer<DataItemRule<P, T, FTT>>
        )
      : rule
  ) as z.infer<DataItemRule<P, T, FTT>>
}

function adaptRuleIntoFallThroughRule<
  P extends z.ZodTypeAny,
  T extends z.ZodRawShape,
  FTT extends z.ZodRawShape
>(
  targetingValidators: T,
  fallThroughTargetingValidators: FTT,
  rule: z.infer<DataItemRule<P, T, FTT>>
): z.infer<RuleWithFallThrough<P, T, FTT>> {
  if ('fallThrough' in rule) return rule
  return {
    targeting: filterTargeting(targetingValidators, rule.targeting || {}),
    fallThrough: [
      {
        payload: rule.payload,
        targeting: filterTargeting(
          fallThroughTargetingValidators,
          rule.targeting || {}
        ),
      },
    ],
  } as z.infer<RuleWithFallThrough<P, T, FTT>>
}
