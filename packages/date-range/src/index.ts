import { createTargetingDescriptor, runtypes as rt } from '@config/api'

const DateRange = rt.Record({
  end: rt.String.optional(),
  start: rt.String.optional(),
})

type DateRange = rt.Static<typeof DateRange>

const dateRangeTargeting = createTargetingDescriptor({
  predicate: (q) => (t) =>
    Array.isArray(t) ? dateRangesPredicate(t, q) : dateRangePredicate(t, q),
  queryValidator: DateRange,
  requiresQuery: false,
  targetingValidator: DateRange.Or(rt.Array(DateRange)),
})

export default dateRangeTargeting

function dateRangePredicate(t: DateRange, q?: DateRange) {
  return q?.start || q?.end ? queryDateRange(t, q) : queryDateRangeAgainstNow(t)
}

function dateRangesPredicate(ts: DateRange[], q?: DateRange) {
  return (
    Object.keys(ts).length === 0 || ts.some((t) => dateRangePredicate(t, q))
  )
}

function queryDateRange(t: DateRange, q: DateRange) {
  const qStart = q.start ? new Date(q.start).getTime() : 0
  const tStart = t.start ? new Date(t.start).getTime() : 0
  const qEnd = q.end ? new Date(q.end).getTime() : Infinity
  const tEnd = t.end ? new Date(t.end).getTime() : Infinity
  const tooLate = tEnd < qStart
  const tooEarly = tStart > qEnd
  return !tooLate && !tooEarly
}

function queryDateRangeAgainstNow(t: DateRange) {
  const now = Date.now()
  const tooLate = t.end && new Date(t.end).getTime() <= now
  const tooEarly = t.start && new Date(t.start).getTime() > now
  return !tooLate && !tooEarly
}
