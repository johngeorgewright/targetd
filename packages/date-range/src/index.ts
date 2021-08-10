import { createTargetingDescriptor, runtypes as rt } from '@config/api'

const DateRange = rt.Record({
  end: rt.String.optional(),
  start: rt.String.optional(),
})

type DateRange = rt.Static<typeof DateRange>

export default createTargetingDescriptor(
  'dateRange',
  rt.Undefined,
  DateRange.Or(rt.Array(DateRange)),
  () => (t) => Array.isArray(t) ? dateRangesPredicate(t) : dateRangePredicate(t)
)

function dateRangePredicate(t: DateRange) {
  const now = Date.now()
  const tooLate = t.end && new Date(t.end).getTime() <= now
  const tooEarly = t.start && new Date(t.start).getTime() > now
  return !tooLate && !tooEarly
}

function dateRangesPredicate(ts: DateRange[]) {
  return Object.keys(ts).length === 0 || ts.some((t) => dateRangePredicate(t))
}
