import {
  type ZodUnion,
  type ZodRawShape,
  type ZodTypeAny,
  strictObject,
  type ZodArray,
  type ZodObject,
  type ZodOptional,
} from 'zod'
import { type ZodPartialObject } from '../types'

function DataItemRule<
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
  const Rule = RuleWithPayload(Payload, targeting, allowMultipleTargeting)

  const FallThroughRule = RuleWithFallThrough(
    Payload,
    targeting,
    fallThroughTargeting,
    allowMultipleTargeting,
  )

  return Rule.or(FallThroughRule) as DataItemRule<
    P,
    T,
    CT,
    AllowMultipleTargeting
  >
}

type DataItemRule<
  Payload extends ZodTypeAny,
  Targeting extends ZodRawShape,
  FallThroughTargeting extends ZodRawShape,
  AllowMultipleTargeting extends boolean = true,
> = ZodUnion<
  [
    RuleWithPayload<Payload, Targeting, AllowMultipleTargeting>,
    RuleWithFallThrough<
      Payload,
      Targeting,
      FallThroughTargeting,
      AllowMultipleTargeting
    >,
  ]
>

export default DataItemRule

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

export type RuleWithPayload<
  Payload extends ZodTypeAny,
  Targeting extends ZodRawShape,
  AllowMultipleTargeting extends boolean = true,
> = ZodObject<
  {
    targeting: ZodOptional<
      AllowMultipleTargeting extends true
        ? MultipleRuleTargeting<Targeting>
        : SingularRuleTargeting<Targeting>
    >
    payload: Payload
  },
  'strict'
>

export function RuleWithPayload<
  P extends ZodTypeAny,
  T extends ZodRawShape,
  AllowMultipleTargeting extends boolean = true,
>(Payload: P, targeting: T, allowMultipleTargeting = true) {
  return strictObject({
    targeting: (allowMultipleTargeting
      ? MultipleRuleTargeting(targeting)
      : SingularRuleTargeting(targeting)
    ).optional(),
    payload: Payload,
  }) as RuleWithPayload<P, T, AllowMultipleTargeting>
}

export type RuleWithFallThrough<
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
      RuleWithPayload<Payload, FallThroughTargeting, AllowMultipleTargeting>
    >
  },
  'strict'
>

export function RuleWithFallThrough<
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
    fallThrough: RuleWithPayload(payload, fallThroughTargeting).array(),
  }) as RuleWithFallThrough<
    Payload,
    Targeting,
    FallThroughTargeting,
    AllowMultipleTargeting
  >
}
