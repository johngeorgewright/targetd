import { Array, Optional, Record, Runtype, Union } from 'runtypes'

function ConfigItemRule<P extends Runtype, T extends Record<any, any>>(
  Payload: P,
  Targeting: T
) {
  const RuleWithPayload = Record({
    targeting: Targeting.optional(),
    payload: Payload,
  })

  const ClientConfigItemRule = Record({
    targeting: Targeting.optional(),
    client: Array(RuleWithPayload),
  })

  return RuleWithPayload.Or(ClientConfigItemRule)
}

type ConfigItemRule<
  Payload extends Runtype,
  Targeting extends Record<any, any>
> = Union<
  [
    Record<
      {
        targeting: Optional<Targeting>
        payload: Payload
      },
      false
    >,
    Record<
      {
        targeting: Optional<Targeting>
        client: Array<
          Record<
            {
              targeting: Optional<Targeting>
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

export default ConfigItemRule
