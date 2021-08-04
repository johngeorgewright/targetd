import { Array, Optional, Record, Union, Unknown } from 'runtypes'

function ConfigItemRule<T extends Record<any, any>>(Targeting: T) {
  const RuleWithPayload = Record({
    targeting: Targeting.optional(),
    payload: Unknown,
  })

  const ClientConfigItemRule = Record({
    targeting: Targeting.optional(),
    client: Array(RuleWithPayload),
  })

  return RuleWithPayload.Or(ClientConfigItemRule)
}

type ConfigItemRule<Targeting extends Record<any, any>> = Union<
  [
    Record<
      {
        targeting: Optional<Targeting>
        payload: Unknown
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
              payload: Unknown
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
