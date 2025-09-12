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
  P extends $ZodType,
  T extends $ZodShape,
  CT extends $ZodShape,
  V extends Record<string, any>,
  AllowMultipleTargeting extends boolean = true,
>(
  variablesRegistry: VariablesRegistry,
  Payload: P,
  targeting: T,
  fallThroughTargeting: CT,
  allowMultipleTargeting = true,
): DataItemRuleParser<
  P,
  T,
  CT,
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
    P,
    T,
    CT,
    AllowMultipleTargeting
  >
}

export type DataItemRuleParser<
  Payload extends $ZodType,
  Targeting extends $ZodShape,
  FallThroughTargeting extends $ZodShape,
  AllowMultipleTargeting extends boolean = true,
> = ZodMiniUnion<
  [
    RuleWithPayloadParser<
      Payload,
      Targeting,
      AllowMultipleTargeting
    >,
    RuleWithFallThroughParser<
      Payload,
      Targeting,
      FallThroughTargeting,
      AllowMultipleTargeting
    >,
  ]
>

/**
 * @see https://github.com/colinhacks/zod/issues/4698
 */
export type DataItemRule<
  Payload extends $ZodType,
  Targeting extends $ZodShape,
  FallThroughTargeting extends $ZodShape,
  AllowMultipleTargeting extends boolean = true,
> =
  | RuleWithPayload<Payload, Targeting, AllowMultipleTargeting>
  | RuleWithFallThrough<
    Payload,
    Targeting,
    FallThroughTargeting,
    AllowMultipleTargeting
  >

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
  Payload extends $ZodType,
  Targeting extends $ZodShape,
  AllowMultipleTargeting extends boolean = true,
> = ZodMiniObject<
  {
    payload: RecursiveVariableResolver<Payload>
    targeting: ZodMiniOptional<
      AllowMultipleTargeting extends true ? MultipleRuleTargeting<Targeting>
        : SingularRuleTargeting<Targeting>
    >
  },
  $strict
>

export function RuleWithPayloadParser<
  P extends $ZodType,
  T extends $ZodShape,
  AllowMultipleTargeting extends boolean = true,
>(
  variablesRegistry: VariablesRegistry,
  Payload: P,
  targeting: T,
  strictTargeting: boolean,
  allowMultipleTargeting = true as AllowMultipleTargeting,
): RuleWithPayloadParser<P, T, AllowMultipleTargeting> {
  return strictObject({
    payload: attachVariableResolver(variablesRegistry, Payload),
    targeting: optional(
      allowMultipleTargeting
        ? MultipleRuleTargeting(targeting, strictTargeting)
        : SingularRuleTargeting(targeting, strictTargeting),
    ),
  }) as RuleWithPayloadParser<P, T, AllowMultipleTargeting>
}

/**
 * @see https://github.com/colinhacks/zod/issues/4698
 */
export interface RuleWithPayloadIn<
  Payload extends $ZodType,
  Targeting extends $ZodShape,
  AllowMultipleTargeting extends boolean = true,
> {
  payload: input<RecursiveVariableResolver<Payload>>
  targeting?: input<
    AllowMultipleTargeting extends true ? MultipleRuleTargeting<Targeting>
      : SingularRuleTargeting<Targeting>
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
  Payload extends $ZodType,
  Targeting extends $ZodShape,
  FallThroughTargeting extends $ZodShape,
  AllowMultipleTargeting extends boolean = true,
> = ZodMiniObject<
  {
    targeting: ZodMiniOptional<
      AllowMultipleTargeting extends true ? MultipleRuleTargeting<Targeting>
        : SingularRuleTargeting<Targeting>
    >
    fallThrough: ZodMiniArray<
      RuleWithPayloadParser<
        Payload,
        FallThroughTargeting,
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
  Payload extends $ZodType,
  Targeting extends $ZodShape,
  FallThroughTargeting extends $ZodShape,
  AllowMultipleTargeting extends boolean = true,
> {
  fallThrough: RuleWithPayload<
    Payload,
    FallThroughTargeting,
    AllowMultipleTargeting
  >[]
  targeting?: output<
    AllowMultipleTargeting extends true ? MultipleRuleTargeting<Targeting>
      : SingularRuleTargeting<Targeting>
  >
}

export function RuleWithFallThroughParser<
  Payload extends $ZodType,
  Targeting extends $ZodShape,
  FallThroughTargeting extends $ZodShape,
  Variables extends Record<string, any>,
  AllowMultipleTargeting extends boolean = true,
>(
  variablesRegistry: VariablesRegistry,
  payload: Payload,
  targeting: Targeting,
  fallThroughTargeting: FallThroughTargeting,
  strictTargeting: boolean,
  allowMultipleTargeting = true,
): RuleWithFallThroughParser<
  Payload,
  Targeting,
  FallThroughTargeting,
  AllowMultipleTargeting
> {
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
  }) as RuleWithFallThroughParser<
    Payload,
    Targeting,
    FallThroughTargeting,
    AllowMultipleTargeting
  >
}
