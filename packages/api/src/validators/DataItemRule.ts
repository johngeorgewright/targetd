import * as rt from 'runtypes'

function DataItemRule<
  P extends rt.Runtype,
  T extends Record<string, rt.Runtype>
>(Payload: P, targeting: T) {
  const Targeting = rt.Partial(targeting).optional()

  const RuleWithPayload = rt.Record({
    targeting: Targeting,
    payload: Payload,
  })

  const ClientDataItemRule = rt.Record({
    targeting: Targeting,
    client: rt.Array(RuleWithPayload),
  })

  return RuleWithPayload.Or(ClientDataItemRule)
}

type DataItemRule<
  Payload extends rt.Runtype,
  Targeting extends Record<string, rt.Runtype>
> = rt.Union<
  [
    RuleWithPayload<Payload, Targeting>,
    rt.Record<
      {
        targeting: rt.Optional<rt.Partial<Targeting, false>>
        client: rt.Array<RuleWithPayload<Payload, Targeting>, false>
      },
      false
    >
  ]
>

export default DataItemRule

export type RuleWithPayload<
  Payload extends rt.Runtype,
  Targeting extends Record<string, rt.Runtype>
> = rt.Record<
  {
    targeting: rt.Optional<rt.Partial<Targeting, false>>
    payload: Payload
  },
  false
>
