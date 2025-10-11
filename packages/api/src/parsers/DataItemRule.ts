import {
  array,
  object,
  optional,
  partial,
  strictObject,
  union,
  type ZodMiniArray,
  type ZodMiniObject,
  type ZodMiniOptional,
  type ZodMiniUnion,
} from 'zod/mini'
import type { ZodPartialObject } from '../types.ts'
import type { $strict, $ZodShape, $ZodType, input, output } from 'zod/v4/core'
import {
  attachVariableResolver,
  type RecursiveVariableResolver,
} from './attachVariableResolver.ts'
import type { VariablesRegistry } from './variablesRegistry.ts'
import type * as DT from '../types/Data.ts'

/**
 * Parses a single item rule.
 *
 * @example
 * Payload only rules
 * ```ts
 * import { equal, assertThrows } from 'jsr:@std/assert'
 * import { z } from 'zod/mini'
 * import { variablesFor } from './variablesRegistry.ts'
 * const dataItemRuleParser = DataItemRuleParser(
 *   variablesFor(z.number()),
 *   z.number(),
 *   {},
 *   {}
 * )
 * equal(
 *   z.parse(dataItemRuleParser, { payload: 123 }),
 *   { payload: 123 }
 * )
 * assertThrows(() => z.parse(dataItemRuleParser, {}))
 * assertThrows(() => z.parse(dataItemRuleParser, { payload: '123' }))
 * ```
 *
 * With targeting.
 * ```ts
 * import { equal } from 'jsr:@std/assert'
 * import { z } from 'zod/mini'
 * const dataItemRuleParser = DataItemRuleParser(
 *   variablesFor(z.number()),
 *   z.number(),
 *   { foo: z.array(z.string()) },
 *   {}
 * )
 * equal(
 *   z.parse(dataItemRuleParser, {
 *     targeting: { foo: ['bar'] },
 *     payload: 123
 *   }),
 *   {
 *     targeting: { foo: ['bar'] },
 *     payload: 123
 *   }
 * )
 * ```
 *
 * With fall through targeting:
 * ```ts
 * import { assertThrows, equal } from 'jsr:@std/assert'
 * import { z } from 'zod/mini'
 * const dataItemRuleParser = DataItemRuleParser(
 *   variablesFor(z.number()),
 *   z.number(),
 *   {},
 *   { foo: z.array(z.string()) },
 * )
 * equal(
 *   z.parse(dataItemRuleParser, {
 *     fallThrough: [{ targeting: { foo: ['bar'] }, payload: 123 }],
 *   }),
 *   {
 *     fallThrough: [{ targeting: { foo: ['bar'] }, payload: 123 }],
 *   }
 * )
 * assertThrows(() => z.parse(dataItemRuleParser, {
 *   targeting: { foo: ['bar'] },
 *   fallThrough: [{ payload: 123 }]
 * }))
 * ```
 */
export function DataItemRuleParser<
  $ extends DT.Meta,
  PayloadParser extends $ZodType,
  VariableRegistry extends Record<string, any>,
  AllowMultipleTargeting extends boolean = true,
>(
  variablesRegistry: VariablesRegistry,
  Payload: PayloadParser,
  targeting: $['TargetingParsers'],
  fallThroughTargeting: $['FallThroughTargetingParsers'],
  allowMultipleTargeting = true,
): DataItemRuleParser<
  $,
  PayloadParser,
  AllowMultipleTargeting
> {
  const Rule = RuleWithPayloadParser(
    variablesRegistry,
    Payload,
    targeting,
    allowMultipleTargeting,
  )

  const FallThroughRule = RuleWithFallThroughParser(
    variablesRegistry,
    Payload,
    targeting,
    fallThroughTargeting,
    allowMultipleTargeting,
  )

  return union([Rule, FallThroughRule]) as DataItemRuleParser<
    $,
    PayloadParser,
    AllowMultipleTargeting
  >
}

export type DataItemRuleParser<
  $ extends DT.Meta,
  PayloadParser extends $ZodType,
  AllowMultipleTargeting extends boolean = true,
> = ZodMiniUnion<
  [
    RuleWithPayloadParser<$, PayloadParser, AllowMultipleTargeting>,
    RuleWithFallThroughParser<$, PayloadParser, AllowMultipleTargeting>,
  ]
>

/**
 * @see https://github.com/colinhacks/zod/issues/4698
 */
export type DataItemRule<
  $ extends DT.Meta,
  PayloadParser extends $ZodType,
  AllowMultipleTargeting extends boolean = true,
> =
  | RuleWithPayload<
    PayloadParser,
    $['TargetingParsers'],
    AllowMultipleTargeting
  >
  | RuleWithFallThrough<$, PayloadParser, AllowMultipleTargeting>

type SingularRuleTargeting<Targeting extends $ZodShape> = ZodPartialObject<
  Targeting,
  $strict
>

function SingularRuleTargeting<Targeting extends $ZodShape>(
  targeting: Targeting,
  strict: boolean,
): SingularRuleTargeting<Targeting> {
  return partial((strict ? strictObject : object)(targeting))
}

type MultipleRuleTargeting<Targeting extends $ZodShape> = ZodMiniUnion<
  [
    ZodPartialObject<Targeting, $strict>,
    ZodMiniArray<ZodPartialObject<Targeting, $strict>>,
  ]
>

function MultipleRuleTargeting<Targeting extends $ZodShape>(
  targeting: Targeting,
  strict: boolean,
): MultipleRuleTargeting<Targeting> {
  const t = SingularRuleTargeting(targeting, strict)
  return union([t, array(t)])
}

export type RuleWithPayloadParser<
  $ extends Pick<DT.Meta, 'TargetingParsers'>,
  Payload extends $ZodType,
  AllowMultipleTargeting extends boolean = true,
> = ZodMiniObject<
  {
    payload: RecursiveVariableResolver<Payload>
    targeting: ZodMiniOptional<
      AllowMultipleTargeting extends true
        ? MultipleRuleTargeting<$['TargetingParsers']>
        : SingularRuleTargeting<$['TargetingParsers']>
    >
  },
  $strict
>

export function RuleWithPayloadParser<
  $ extends DT.Meta,
  PayloadParser extends $ZodType,
  AllowMultipleTargeting extends boolean = true,
>(
  variablesRegistry: VariablesRegistry,
  Payload: PayloadParser,
  targeting: $['TargetingParsers'] & $['FallThroughTargetingParsers'],
  strictTargeting: boolean,
  allowMultipleTargeting = true as AllowMultipleTargeting,
): RuleWithPayloadParser<$, PayloadParser, AllowMultipleTargeting> {
  return strictObject({
    payload: attachVariableResolver(variablesRegistry, Payload),
    targeting: optional(
      allowMultipleTargeting
        ? MultipleRuleTargeting(targeting, strictTargeting)
        : SingularRuleTargeting(targeting, strictTargeting),
    ),
  }) as RuleWithPayloadParser<$, PayloadParser, AllowMultipleTargeting>
}

/**
 * @see https://github.com/colinhacks/zod/issues/4698
 */
export interface RuleWithPayloadIn<
  $ extends DT.Meta,
  PayloadParser extends $ZodType,
  AllowMultipleTargeting extends boolean = true,
> {
  payload: input<RecursiveVariableResolver<PayloadParser>>
  targeting?: input<
    AllowMultipleTargeting extends true ? MultipleRuleTargeting<
        $['TargetingParsers'] & $['FallThroughTargetingParsers']
      >
      : SingularRuleTargeting<
        $['TargetingParsers'] & $['FallThroughTargetingParsers']
      >
  >
}

/**
 * @see https://github.com/colinhacks/zod/issues/4698
 */
export interface RuleWithPayload<
  Payload extends $ZodType,
  Targeting extends $ZodShape,
  AllowMultipleTargeting extends boolean = true,
> {
  payload: output<Payload>
  targeting?: output<
    AllowMultipleTargeting extends true ? MultipleRuleTargeting<Targeting>
      : SingularRuleTargeting<Targeting>
  >
}

export type RuleWithFallThroughParser<
  $ extends DT.Meta,
  PayloadParser extends $ZodType,
  AllowMultipleTargeting extends boolean = true,
> = ZodMiniObject<
  {
    targeting: ZodMiniOptional<
      AllowMultipleTargeting extends true
        ? MultipleRuleTargeting<$['TargetingParsers']>
        : SingularRuleTargeting<$['TargetingParsers']>
    >
    fallThrough: ZodMiniArray<
      RuleWithPayloadParser<
        $,
        PayloadParser,
        AllowMultipleTargeting
      >
    >
  },
  $strict
>

/**
 * @see https://github.com/colinhacks/zod/issues/4698
 */
export interface RuleWithFallThrough<
  $ extends DT.Meta,
  PayloadParser extends $ZodType,
  AllowMultipleTargeting extends boolean = true,
> {
  fallThrough: RuleWithPayload<
    PayloadParser,
    $['FallThroughTargetingParsers'],
    AllowMultipleTargeting
  >[]
  targeting?: output<
    AllowMultipleTargeting extends true
      ? MultipleRuleTargeting<$['TargetingParsers']>
      : SingularRuleTargeting<$['TargetingParsers']>
  >
}

export function RuleWithFallThroughParser<
  $ extends DT.Meta,
  PayloadParser extends $ZodType,
  Variables extends Record<string, any>,
  AllowMultipleTargeting extends boolean = true,
>(
  variablesRegistry: VariablesRegistry,
  payload: PayloadParser,
  targeting: $['TargetingParsers'],
  fallThroughTargeting: $['FallThroughTargetingParsers'],
  strictTargeting: boolean,
  allowMultipleTargeting = true,
): RuleWithFallThroughParser<$, PayloadParser, AllowMultipleTargeting> {
  return strictObject({
    targeting: optional(
      allowMultipleTargeting
        ? MultipleRuleTargeting(targeting, strictTargeting)
        : SingularRuleTargeting(targeting, strictTargeting),
    ),
    fallThrough: array(
      RuleWithPayloadParser(
        variablesRegistry,
        payload,
        fallThroughTargeting,
        strictTargeting,
      ),
    ),
  }) as RuleWithFallThroughParser<$, PayloadParser, AllowMultipleTargeting>
}
