import {
  array,
  optional,
  partial,
  strictObject,
  union,
  type ZodMiniArray,
  type ZodMiniObject,
  type ZodMiniOptional,
  type ZodMiniUnion,
} from 'zod/v4-mini'
import type { ZodPartialObject } from '../types.ts'
import type { $strict, $ZodShape, $ZodType, output } from 'zod/v4/core'

export function DataItemRuleParser<
  P extends $ZodType,
  T extends $ZodShape,
  CT extends $ZodShape,
  AllowMultipleTargeting extends boolean = true,
>(
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
  const Rule = RuleWithPayloadParser(Payload, targeting, allowMultipleTargeting)

  const FallThroughRule = RuleWithFallThroughParser(
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
    RuleWithPayloadParser<Payload, Targeting, AllowMultipleTargeting>,
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
): SingularRuleTargeting<Targeting> {
  return partial(strictObject(targeting))
}

type MultipleRuleTargeting<Targeting extends $ZodShape> = ZodMiniUnion<
  [
    ZodPartialObject<Targeting, $strict>,
    ZodMiniArray<ZodPartialObject<Targeting, $strict>>,
  ]
>

function MultipleRuleTargeting<Targeting extends $ZodShape>(
  targeting: Targeting,
): MultipleRuleTargeting<Targeting> {
  const t = SingularRuleTargeting(targeting)
  return union([t, array(t)])
}

export type RuleWithPayloadParser<
  Payload extends $ZodType,
  Targeting extends $ZodShape,
  AllowMultipleTargeting extends boolean = true,
> = ZodMiniObject<
  {
    payload: Payload
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
  Payload: P,
  targeting: T,
  allowMultipleTargeting = true as AllowMultipleTargeting,
): RuleWithPayloadParser<P, T, AllowMultipleTargeting> {
  return strictObject({
    payload: Payload,
    targeting: optional(
      allowMultipleTargeting
        ? MultipleRuleTargeting(targeting)
        : SingularRuleTargeting(targeting),
    ),
  }) as RuleWithPayloadParser<P, T, AllowMultipleTargeting>
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
  AllowMultipleTargeting extends boolean = true,
>(
  payload: Payload,
  targeting: Targeting,
  fallThroughTargeting: FallThroughTargeting,
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
        ? MultipleRuleTargeting(targeting)
        : SingularRuleTargeting(targeting),
    ),
    fallThrough: array(RuleWithPayloadParser(payload, fallThroughTargeting)),
  }) as RuleWithFallThroughParser<
    Payload,
    Targeting,
    FallThroughTargeting,
    AllowMultipleTargeting
  >
}
