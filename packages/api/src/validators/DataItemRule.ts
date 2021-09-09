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
    rt.Record<
      {
        targeting: rt.Optional<rt.Partial<Targeting, false>>
        payload: Payload
      },
      false
    >,
    rt.Record<
      {
        targeting: rt.Optional<rt.Partial<Targeting, false>>
        client: rt.Array<
          rt.Record<
            {
              targeting: rt.Optional<rt.Partial<Targeting, false>>
              payload: Payload
            },
            false
          >,
          false
        >
      },
      false
    >
  ]
>

export default DataItemRule
