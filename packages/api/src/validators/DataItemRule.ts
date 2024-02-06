import z from 'zod'
import { ZodPartialObject } from '../types'

function DataItemRule<
  P extends z.ZodTypeAny,
  T extends z.ZodRawShape,
  CT extends z.ZodRawShape,
  AllowMultipleTargeting extends boolean = true
>(
  Payload: P,
  targeting: T,
  fallThroughTargeting: CT,
  allowMultipleTargeting = true
): DataItemRule<P, T, CT, AllowMultipleTargeting> {
  const Rule = RuleWithPayload(Payload, targeting, allowMultipleTargeting)

  const FallThroughRule = RuleWithFallThrough(
    Payload,
    targeting,
    fallThroughTargeting,
    allowMultipleTargeting
  )

  return Rule.or(FallThroughRule) as DataItemRule<
    P,
    T,
    CT,
    AllowMultipleTargeting
  >
}

type DataItemRule<
  Payload extends z.ZodTypeAny,
  Targeting extends z.ZodRawShape,
  FallThroughTargeting extends z.ZodRawShape,
  AllowMultipleTargeting extends boolean = true
> = z.ZodUnion<
  [
    RuleWithPayload<Payload, Targeting, AllowMultipleTargeting>,
    RuleWithFallThrough<
      Payload,
      Targeting,
      FallThroughTargeting,
      AllowMultipleTargeting
    >
  ]
>

export default DataItemRule

type SingularRuleTargeting<Targeting extends z.ZodRawShape> = z.ZodOptional<
  ZodPartialObject<Targeting, 'strict'>
>

function SingularRuleTargeting<Targeting extends z.ZodRawShape>(
  targeting: Targeting
) {
  return z.strictObject(targeting).partial()
}

type MultipleRuleTargeting<Targeting extends z.ZodRawShape> = z.ZodOptional<
  z.ZodUnion<
    [
      ZodPartialObject<Targeting, 'strict'>,
      z.ZodArray<ZodPartialObject<Targeting, 'strict'>>
    ]
  >
>

function MultipleRuleTargeting<Targeting extends z.ZodRawShape>(
  targeting: Targeting
): MultipleRuleTargeting<Targeting> {
  const t = z.strictObject(targeting).partial()
  return t.or(t.array()).optional()
}

export type RuleWithPayload<
  Payload extends z.ZodTypeAny,
  Targeting extends z.ZodRawShape,
  AllowMultipleTargeting extends boolean = true
> = z.ZodObject<
  {
    targeting: AllowMultipleTargeting extends true
      ? MultipleRuleTargeting<Targeting>
      : SingularRuleTargeting<Targeting>
    payload: Payload
  },
  'strict'
>

export function RuleWithPayload<
  P extends z.ZodTypeAny,
  T extends z.ZodRawShape,
  AllowMultipleTargeting extends boolean = true
>(
  Payload: P,
  targeting: T,
  allowMultipleTargeting = true
): RuleWithPayload<P, T, AllowMultipleTargeting> {
  return z.strictObject({
    targeting: allowMultipleTargeting
      ? MultipleRuleTargeting(targeting)
      : SingularRuleTargeting(targeting),
    payload: Payload,
  }) as RuleWithPayload<P, T, AllowMultipleTargeting>
}

export type RuleWithFallThrough<
  Payload extends z.ZodTypeAny,
  Targeting extends z.ZodRawShape,
  FallThroughTargeting extends z.ZodRawShape,
  AllowMultipleTargeting extends boolean = true
> = z.ZodObject<
  {
    targeting: AllowMultipleTargeting extends true
      ? MultipleRuleTargeting<Targeting>
      : SingularRuleTargeting<Targeting>
    fallThrough: z.ZodArray<
      RuleWithPayload<Payload, FallThroughTargeting, AllowMultipleTargeting>
    >
  },
  'strict'
>

export function RuleWithFallThrough<
  Payload extends z.ZodTypeAny,
  Targeting extends z.ZodRawShape,
  FallThroughTargeting extends z.ZodRawShape,
  AllowMultipleTargeting extends boolean = true
>(
  payload: Payload,
  targeting: Targeting,
  fallThroughTargeting: FallThroughTargeting,
  allowMultipleTargeting = true
): RuleWithFallThrough<
  Payload,
  Targeting,
  FallThroughTargeting,
  AllowMultipleTargeting
> {
  return z.strictObject({
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
