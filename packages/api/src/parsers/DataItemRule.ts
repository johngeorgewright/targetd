import {
  strictObject,
  type ZodArray,
  type ZodObject,
  type ZodOptional,
  type ZodRawShape,
  type ZodTypeAny,
  type ZodUnion,
} from 'zod'
import type { ZodPartialObject } from '../types.ts'

export function DataItemRuleParser<
  P extends ZodTypeAny,
  T extends ZodRawShape,
  CT extends ZodRawShape,
  AllowMultipleTargeting extends boolean = true,
>(
  Payload: P,
  targeting: T,
  fallThroughTargeting: CT,
  allowMultipleTargeting = true,
) {
  const Rule = RuleWithPayloadParser(Payload, targeting, allowMultipleTargeting)

  const FallThroughRule = RuleWithFallThroughParser(
    Payload,
    targeting,
    fallThroughTargeting,
    allowMultipleTargeting,
  )

  return Rule.or(FallThroughRule) as DataItemRuleParser<
    P,
    T,
    CT,
    AllowMultipleTargeting
  >
}

export type DataItemRuleParser<
  Payload extends ZodTypeAny,
  Targeting extends ZodRawShape,
  FallThroughTargeting extends ZodRawShape,
  AllowMultipleTargeting extends boolean = true,
> = ZodUnion<
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

type SingularRuleTargeting<Targeting extends ZodRawShape> = ZodPartialObject<
  Targeting,
  'strict'
>

function SingularRuleTargeting<Targeting extends ZodRawShape>(
  targeting: Targeting,
): SingularRuleTargeting<Targeting> {
  return strictObject(targeting).partial()
}

type MultipleRuleTargeting<Targeting extends ZodRawShape> = ZodUnion<
  [
    ZodPartialObject<Targeting, 'strict'>,
    ZodArray<ZodPartialObject<Targeting, 'strict'>>,
  ]
>

function MultipleRuleTargeting<Targeting extends ZodRawShape>(
  targeting: Targeting,
): MultipleRuleTargeting<Targeting> {
  const t = strictObject(targeting).partial()
  return t.or(t.array())
}

export type RuleWithPayloadParser<
  Payload extends ZodTypeAny,
  Targeting extends ZodRawShape,
  AllowMultipleTargeting extends boolean = true,
> = ZodObject<
  {
    targeting: ZodOptional<
      AllowMultipleTargeting extends true ? MultipleRuleTargeting<Targeting>
        : SingularRuleTargeting<Targeting>
    >
    payload: Payload
  },
  'strict'
>

export function RuleWithPayloadParser<
  P extends ZodTypeAny,
  T extends ZodRawShape,
  AllowMultipleTargeting extends boolean = true,
>(Payload: P, targeting: T, allowMultipleTargeting = true) {
  return strictObject({
    targeting: (allowMultipleTargeting
      ? MultipleRuleTargeting(targeting)
      : SingularRuleTargeting(targeting)).optional(),
    payload: Payload,
  }) as RuleWithPayloadParser<P, T, AllowMultipleTargeting>
}

export type RuleWithFallThroughParser<
  Payload extends ZodTypeAny,
  Targeting extends ZodRawShape,
  FallThroughTargeting extends ZodRawShape,
  AllowMultipleTargeting extends boolean = true,
> = ZodObject<
  {
    targeting: AllowMultipleTargeting extends true
      ? MultipleRuleTargeting<Targeting>
      : SingularRuleTargeting<Targeting>
    fallThrough: ZodArray<
      RuleWithPayloadParser<
        Payload,
        FallThroughTargeting,
        AllowMultipleTargeting
      >
    >
  },
  'strict'
>

export function RuleWithFallThroughParser<
  Payload extends ZodTypeAny,
  Targeting extends ZodRawShape,
  FallThroughTargeting extends ZodRawShape,
  AllowMultipleTargeting extends boolean = true,
>(
  payload: Payload,
  targeting: Targeting,
  fallThroughTargeting: FallThroughTargeting,
  allowMultipleTargeting = true,
) {
  return strictObject({
    targeting: allowMultipleTargeting
      ? MultipleRuleTargeting(targeting)
      : SingularRuleTargeting(targeting),
    fallThrough: RuleWithPayloadParser(payload, fallThroughTargeting).array(),
  }) as RuleWithFallThroughParser<
    Payload,
    Targeting,
    FallThroughTargeting,
    AllowMultipleTargeting
  >
}
