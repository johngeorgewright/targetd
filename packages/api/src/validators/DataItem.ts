import * as rt from 'runtypes'
import ConfigItemRule from './DataItemRule'

function DataItem<P extends rt.Runtype, T extends Record<string, rt.Runtype>>(
  Payload: P,
  targeting: T
) {
  return rt.Record({
    rules: rt.Array(ConfigItemRule(Payload, targeting)),
  })
}

type DataItem<
  Payload extends rt.Runtype,
  Targeting extends Record<string, rt.Runtype>
> = rt.Record<
  {
    rules: rt.Array<ConfigItemRule<Payload, Targeting>, false>
  },
  false
>

export default DataItem
