import {
  createTargetingDescriptor,
  type TargetingDescriptor,
} from '@targetd/api'
import {
  array,
  partial,
  regex,
  strictObject,
  string,
  union,
  type ZodMiniArray,
  type ZodMiniObject,
  type ZodMiniOptional,
  type ZodMiniString,
  type ZodMiniUnion,
} from 'zod/mini'
import type { $strict, output } from 'zod/v4/core'

type ISODateTimeParser = ZodMiniString<string>

const isoDateTimeParser: ISODateTimeParser = string().check(
  regex(
    /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])(T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\.[0-9]+)?(Z|[+-](?:2[0-3]|[01][0-9]):[0-5][0-9])?)?$/,
    'Must represent an ISO date',
  ),
)

type DateRangeParser = ZodMiniObject<{
  end: ZodMiniOptional<ISODateTimeParser>
  start: ZodMiniOptional<ISODateTimeParser>
}, $strict>

const dateRangeParser: DateRangeParser = partial(strictObject({
  end: isoDateTimeParser,
  start: isoDateTimeParser,
}))

type DateRange = output<typeof dateRangeParser>

type TargetingParser = ZodMiniUnion<
  [typeof dateRangeParser, ZodMiniArray<typeof dateRangeParser>]
>

const targetingParser: TargetingParser = union([
  dateRangeParser,
  array(dateRangeParser),
])

const dateRangeTargeting: TargetingDescriptor<
  TargetingParser,
  typeof dateRangeParser,
  {
    end?: string
    start?: string
  }
> = createTargetingDescriptor({
  predicate: (q) => (t) =>
    Array.isArray(t) ? dateRangesPredicate(t, q) : dateRangePredicate(t, q),
  queryParser: dateRangeParser,
  requiresQuery: false,
  targetingParser,
})

export default dateRangeTargeting

function dateRangePredicate(t: DateRange, q?: DateRange): boolean {
  return q?.start || q?.end ? queryDateRange(t, q) : queryDateRangeAgainstNow(t)
}

function dateRangesPredicate(ts: DateRange[], q?: DateRange): boolean {
  return ts.length === 0 || ts.some((t) => dateRangePredicate(t, q))
}

function queryDateRange(t: DateRange, q: DateRange): boolean {
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
