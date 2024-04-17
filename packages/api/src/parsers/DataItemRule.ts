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
import {
  RecursivleyWithVariableResolver,
  attachVariableResolver,
} from './attachVariableResolver'

export function DataItemRuleParser<
  P extends ZodTypeAny,
  T extends ZodRawShape,
  CT extends ZodRawShape,
  QT extends ZodRawShape,
  AllowMultipleTargeting extends boolean = true,
>(
  Payload: P,
  targeting: T,
  fallThroughTargeting: CT,
  query: QT,
  allowMultipleTargeting = true,
) {
  const Rule = RuleWithPayloadParser(
    Payload,
    targeting,
    query,
    allowMultipleTargeting,
  )

  const FallThroughRule = RuleWithFallThroughParser(
    Payload,
    targeting,
    fallThroughTargeting,
    query,
    allowMultipleTargeting,
  )

  return Rule.or(FallThroughRule) as DataItemRuleParser<
    P,
    T,
    CT,
    QT,
    AllowMultipleTargeting
  >
}

export type DataItemRuleParser<
  Payload extends ZodTypeAny,
  Targeting extends ZodRawShape,
  FallThroughTargeting extends ZodRawShape,
  Query extends ZodRawShape,
  AllowMultipleTargeting extends boolean = true,
> = ZodUnion<
  [
    RuleWithPayloadParser<Payload, Targeting, Query, AllowMultipleTargeting>,
    RuleWithFallThroughParser<
      Payload,
      Targeting,
      FallThroughTargeting,
      Query,
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
  Query extends ZodRawShape,
  AllowMultipleTargeting extends boolean = true,
> = ZodObject<
  {
    targeting: ZodOptional<
      AllowMultipleTargeting extends true
        ? MultipleRuleTargeting<Targeting>
        : SingularRuleTargeting<Targeting>
    >
    payload: RecursivleyWithVariableResolver<Payload, Query>
  },
  'strict'
>

export function RuleWithPayloadParser<
  P extends ZodTypeAny,
  T extends ZodRawShape,
  Q extends ZodRawShape,
  AllowMultipleTargeting extends boolean = true,
>(Payload: P, targeting: T, query: Q, allowMultipleTargeting = true) {
  return strictObject({
    targeting: (allowMultipleTargeting
      ? MultipleRuleTargeting(targeting)
      : SingularRuleTargeting(targeting)
    ).optional(),
    payload: attachVariableResolver(Payload, query),
  }) as RuleWithPayloadParser<P, T, Q, AllowMultipleTargeting>
}
export type RuleWithFallThroughParser<
  Payload extends ZodTypeAny,
  Targeting extends ZodRawShape,
  FallThroughTargeting extends ZodRawShape,
  Query extends ZodRawShape,
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
        Query,
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
  Query extends ZodRawShape,
  AllowMultipleTargeting extends boolean = true,
>(
  payload: Payload,
  targeting: Targeting,
  fallThroughTargeting: FallThroughTargeting,
  query: Query,
  allowMultipleTargeting = true,
) {
  return strictObject({
    targeting: allowMultipleTargeting
      ? MultipleRuleTargeting(targeting)
      : SingularRuleTargeting(targeting),
    fallThrough: RuleWithPayloadParser(
      payload,
      fallThroughTargeting,
      query,
    ).array(),
  }) as RuleWithFallThroughParser<
    Payload,
    Targeting,
    FallThroughTargeting,
    Query,
    AllowMultipleTargeting
  >
}
