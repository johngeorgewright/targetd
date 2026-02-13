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
import type * as DT from '../types/Data.ts'
import type { VariablesRegistry } from './variablesRegistry.ts'

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
  $ extends DT.Meta,
  PayloadParser extends $ZodType,
>(
  variablesRegistry: VariablesRegistry,
  payloadParser: PayloadParser,
  targetingParsers: $['TargetingParsers'],
  fallThroughTargetingParsers: $['FallThroughTargetingParsers'],
  strictTargeting: boolean,
): DataItemRulesParser<$, PayloadParser> {
  return pipe(
    array(
      RuleWithPayloadParser<$, PayloadParser>(
        variablesRegistry,
        payloadParser,
        {
          ...targetingParsers,
          ...fallThroughTargetingParsers,
        },
        strictTargeting,
      ),
    ),
    transform(
      (
        rules: RuleWithPayloadIn<$, PayloadParser>[],
      ): DataItemRule<
        $,
        PayloadParser,
        false
      >[] => {
        const singularTargetedRules = spreadMultiTargetsToSeparateRules(rules)

        let transformedRules: DataItemRule<$, PayloadParser, false>[] = []

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
              rule as DataItemRule<$, PayloadParser, false>,
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
  $ extends DT.Meta,
  PayloadParser extends $ZodType,
> = ZodMiniPipe<
  ZodMiniArray<RuleWithPayloadParser<$, PayloadParser>>,
  ZodMiniTransform<
    DataItemRulesOut<$, PayloadParser>,
    DataItemRulesIn<$, PayloadParser>
  >
>

export type DataItemRulesIn<
  $ extends DT.Meta,
  PayloadParser extends $ZodType,
> = RuleWithPayloadIn<$, PayloadParser>[]
/**
 * Output type for {@link DataItemRulesParser}.
 * Returns transformed rules with fallthrough structure applied.
 *
 * @template $ - Data meta configuration.
 * @template PayloadParser - Zod parser for the payload type.
 */ export type DataItemRulesOut<
  $ extends DT.Meta,
  PayloadParser extends $ZodType,
> = DataItemRule<$, PayloadParser, false>[]

function spreadMultiTargetsToSeparateRules<
  $ extends DT.Meta,
  PayloadParser extends $ZodType,
>(rules: RuleWithPayloadIn<$, PayloadParser>[]) {
  return rules.reduce<RuleWithPayloadIn<$, PayloadParser, false>[]>(
    (rules, rule) => {
      if (Array.isArray(rule.targeting)) {
        for (const targeting of rule.targeting) {
          rules.push({
            payload: rule.payload,
            targeting,
          })
        }
      } else {
        rules.push(rule as RuleWithPayloadIn<$, PayloadParser, false>)
      }
      return rules
    },
    [],
  )
}

function canRulesCombine(
  targetingParsers: $ZodShape,
  a: DataItemRule<DT.Meta, $ZodType, false>,
  b: DataItemRule<DT.Meta, $ZodType, false>,
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
  $ extends DT.Meta,
  PayloadParser extends $ZodType,
>(
  targetingParsers: $['TargetingParsers'],
  fallThroughTargetingParsers: $['FallThroughTargetingParsers'],
  rule: RuleWithPayloadIn<$, PayloadParser, false>,
) {
  return (
    someKeysIntersect(fallThroughTargetingParsers, rule.targeting || {})
      ? adaptRuleIntoFallThroughRule(
        targetingParsers,
        fallThroughTargetingParsers,
        rule as DataItemRule<$, PayloadParser, false>,
      )
      : rule
  ) as DataItemRule<$, PayloadParser, false>
}

function adaptRuleIntoFallThroughRule<
  $ extends DT.Meta,
  PayloadParser extends $ZodType,
>(
  targetingParsers: $['TargetingParsers'],
  fallThroughTargetingParsers: $['FallThroughTargetingParsers'],
  rule: DataItemRule<$, PayloadParser, false>,
): RuleWithFallThrough<$, PayloadParser, false> {
  if ('fallThrough' in rule) return rule
  return {
    targeting: intersection(
      rule.targeting || {},
      targetingParsers,
    ) as ZodPartialInferObject<$['TargetingParsers']>,
    fallThrough: [
      {
        payload: rule.payload,
        targeting: intersection(
          rule.targeting || {},
          fallThroughTargetingParsers,
        ),
      },
    ],
  } as RuleWithFallThrough<$, PayloadParser, false>
}
