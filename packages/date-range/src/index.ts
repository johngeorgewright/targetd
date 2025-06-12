import { createTargetingDescriptor } from '@targetd/api'
import { array, object, type output, string } from 'zod'

const ISODateTime = string().regex(
  /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])(T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\.[0-9]+)?(Z|[+-](?:2[0-3]|[01][0-9]):[0-5][0-9])?)?$/,
  'Must represent an ISO date',
)

const DateRange = object({
  end: ISODateTime,
  start: ISODateTime,
})
  .partial()
  .strict()

type DateRange = output<typeof DateRange>

const dateRangeTargeting = createTargetingDescriptor({
  predicate: (q) => (t) =>
    Array.isArray(t) ? dateRangesPredicate(t, q) : dateRangePredicate(t, q),
  queryParser: DateRange,
  requiresQuery: false,
  targetingParser: DateRange.or(array(DateRange)),
})

export default dateRangeTargeting

function dateRangePredicate(t: DateRange, q?: DateRange) {
  return q?.start || q?.end ? queryDateRange(t, q) : queryDateRangeAgainstNow(t)
}

function dateRangesPredicate(ts: DateRange[], q?: DateRange) {
  return ts.length === 0 || ts.some((t) => dateRangePredicate(t, q))
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
  const tooLate = !!t.end && new Date(t.end).getTime() <= now
  const tooEarly = !!t.start && new Date(t.start).getTime() > now
  return !tooLate && !tooEarly
}
