import * as rt from 'runtypes'
import DataItemRule from './DataItemRule'

function DataItem<P extends rt.Runtype, T extends Record<string, rt.Runtype>>(
  Payload: P,
  targeting: T
) {
  return rt.Record({
    rules: rt.Array(DataItemRule(Payload, targeting)),
  })
}

type DataItem<
  Payload extends rt.Runtype,
  Targeting extends Record<string, rt.Runtype>
> = rt.Record<
  {
    rules: rt.Array<DataItemRule<Payload, Targeting>, false>
  },
  false
>

export default DataItem
