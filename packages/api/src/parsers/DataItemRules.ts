import {
  type DataItemRule,
  type RuleWithFallThrough,
  type RuleWithPayloadIn,
  RuleWithPayloadParser,
} from './DataItemRule.ts'
import {
  arrayLast,
  intersection,
  objectSize,
  someKeysIntersect,
} from '../util.ts'
import deepEqual from 'fast-deep-equal'
import {
  array,
  pipe,
  transform,
  type ZodMiniArray,
  type ZodMiniPipe,
  type ZodMiniTransform,
} from 'zod/mini'
import type { $ZodShape, $ZodType } from 'zod/v4/core'
import type { ZodPartialInferObject } from '../types.ts'

/**
 * Parses an item's `rules` field.
 *
 * @remarks
 * This will transform rules in to fallthrough rules where needed.
 *
 * @example
 * ```ts
 * import { equal, assertThrows } from 'jsr:@std/assert'
 * import { z } from 'zod/mini'
 * const dataItemRulesParser = DataItemRulesParser(
 *   z.number(),
 *   { foo: z.string() },
 *   { bar: z.string() }
 * )
 * equal(
 *   z.parse(dataItemRulesParser, [
 *     { targeting: { foo: 'foo', bar: 'bar' }, payload: 123 },
 *     { targeting: { foo: 'foo' }, payload: 456 },
 *     { payload: 789 },
 *   ]),
 *   [
 *     {
 *       targeting: { foo: 'foo' },
 *       fallThrough: [
 *         { targeting: { bar: 'bar' }, payload: 123 },
 *         { payload: 456 }
 *       ],
 *     },
 *     { payload: 789 },
 *   ]
 * )
 * ```
 */
export function DataItemRulesParser<
  P extends $ZodType,
  T extends $ZodShape,
  FTT extends $ZodShape,
>(
  payloadParser: P,
  targetingParsers: T,
  fallThroughTargetingParsers: FTT,
): DataItemRulesParser<P, T, FTT> {
  return pipe(
    array(RuleWithPayloadParser<P, T & FTT>(payloadParser, {
      ...targetingParsers,
      ...fallThroughTargetingParsers,
    })),
    transform(
      (
        rules: RuleWithPayloadIn<P, T & FTT>[],
      ): DataItemRule<P, T, FTT, false>[] => {
        const singularTargetedRules = spreadMultiTargetsToSeparateRules(rules)

        let transformedRules: DataItemRule<P, T, FTT, false>[] = []

        for (const rule of singularTargetedRules) {
          const prevRule = arrayLast(transformedRules)

          if (!prevRule) {
            transformedRules.push(
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
              rule as DataItemRule<P, T, FTT, false>,
            )

            adaptedPrevRule.fallThrough.push(...adaptedRule.fallThrough)

            transformedRules = [
              ...transformedRules.slice(0, -1),
              adaptedPrevRule,
            ]
          } else {
            transformedRules.push(
              adaptRule(targetingParsers, fallThroughTargetingParsers, rule),
            )
          }
        }

        return transformedRules
      },
    ),
  )
}

export type DataItemRulesParser<
  Payload extends $ZodType,
  Targeting extends $ZodShape,
  FallThroughTargeting extends $ZodShape,
> = ZodMiniPipe<
  ZodMiniArray<
    RuleWithPayloadParser<Payload, Targeting & FallThroughTargeting>
  >,
  ZodMiniTransform<
    DataItemRulesOut<Payload, Targeting, FallThroughTargeting>,
    DataItemRulesIn<Payload, Targeting, FallThroughTargeting>
  >
>

export type DataItemRulesIn<
  Payload extends $ZodType,
  Targeting extends $ZodShape,
  FallThroughTargeting extends $ZodShape,
> = RuleWithPayloadIn<Payload, Targeting & FallThroughTargeting>[]

export type DataItemRulesOut<
  Payload extends $ZodType,
  Targeting extends $ZodShape,
  FallThroughTargeting extends $ZodShape,
> = DataItemRule<Payload, Targeting, FallThroughTargeting, false>[]

function spreadMultiTargetsToSeparateRules<
  P extends $ZodType,
  T extends $ZodShape,
>(rules: RuleWithPayloadIn<P, T>[]) {
  return rules.reduce<RuleWithPayloadIn<P, T, false>[]>(
    (rules, rule) => {
      if (Array.isArray(rule.targeting)) {
        for (const targeting of rule.targeting) {
          rules.push({
            payload: rule.payload,
            targeting,
          })
        }
      } else {
        rules.push(rule as RuleWithPayloadIn<P, T, false>)
      }
      return rules
    },
    [],
  )
}

function canRulesCombine(
  targetingParsers: $ZodShape,
  a: DataItemRule<$ZodType, $ZodShape, $ZodShape, false>,
  b: DataItemRule<$ZodType, $ZodShape, $ZodShape, false>,
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
        aTargetingKeys.length !== objectSize(a.targeting || {})) ||
    !bTargetingKeys.length && !aTargetingKeys.length
  )
}

function adaptRule<
  P extends $ZodType,
  T extends $ZodShape,
  FTT extends $ZodShape,
>(
  targetingParsers: T,
  fallThroughTargetingParsers: FTT,
  rule: RuleWithPayloadIn<P, T & FTT, false>,
) {
  return (
    someKeysIntersect(fallThroughTargetingParsers, rule.targeting || {})
      ? adaptRuleIntoFallThroughRule(
        targetingParsers,
        fallThroughTargetingParsers,
        rule as DataItemRule<P, T, FTT, false>,
      )
      : rule
  ) as DataItemRule<P, T, FTT, false>
}

function adaptRuleIntoFallThroughRule<
  P extends $ZodType,
  T extends $ZodShape,
  FTT extends $ZodShape,
>(
  targetingParsers: T,
  fallThroughTargetingParsers: FTT,
  rule: DataItemRule<P, T, FTT, false>,
): RuleWithFallThrough<P, T, FTT, false> {
  if ('fallThrough' in rule) return rule
  return {
    targeting: intersection(
      rule.targeting || {},
      targetingParsers,
    ) as ZodPartialInferObject<T>,
    fallThrough: [
      {
        payload: rule.payload,
        targeting: intersection(
          rule.targeting || {},
          fallThroughTargetingParsers,
        ),
      },
    ],
  } as RuleWithFallThrough<P, T, FTT, false>
}
