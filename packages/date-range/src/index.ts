import { createTargetingDescriptor, runtypes as rt } from '@config/api'

const DateRange = rt.Record({
  end: rt.String.optional(),
  start: rt.String.optional(),
})

type DateRange = rt.Static<typeof DateRange>

export default createTargetingDescriptor(
  'dateRange',
  DateRange.Or(rt.Array(DateRange)),
  () =>
    ({ dateRange }) =>
      Array.isArray(dateRange)
        ? dateRangesPredicate(dateRange)
        : dateRangePredicate(dateRange)
)

function dateRangePredicate({ end, start }: DateRange) {
  const now = Date.now()
  const tooLate = end && new Date(end).getTime() <= now
  const tooEarly = start && new Date(start).getTime() > now
  return !tooLate && !tooEarly
}

function dateRangesPredicate(dateRanges: DateRange[]) {
  return (
    Object.keys(dateRanges).length === 0 || dateRanges.some(dateRangePredicate)
  )
}
