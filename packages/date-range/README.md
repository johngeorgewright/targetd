# @targetd/date-range

> Adds date range targeting

## Example

```typescript
import { Data } from '@targetd/api'
import dateRangeTargeting from '@targetd/date-range'
import z from 'zod'

const data = Data.create()
  .useTargeting('dateRange', dateRangeTargeting)
  .useData('foo', z.string())
  .addRules('foo', [
    {
      targeting: {
        dateRange: {
          start: '1939-09-01',
          end: '1945-09-02',
        },
      },
      payload: 'WWII',
    },
    {
      targeting: {
        dateRange: {
          start: '2020-01-01T00:00:00',
        },
      },
      payload: '😷',
    },
    {
      payload: 'bar',
    },
  ])

test('will use system time when no targeting is specified', async () => {
  jestDate.advanceTo(new Date('1930-01-01'))
  expect(await data.getPayload('foo', {})).toBe('bar')

  jestDate.advanceTo(new Date('1940-01-01'))
  expect(await data.getPayload('foo', {})).toBe('WWII')

  jestDate.advanceTo(new Date('2021-01-01'))
  expect(await data.getPayload('foo', {})).toBe('😷')
})

test('filter by queries', async () => {
  expect(
    await data.getPayload('foo', { dateRange: { start: '2020-01-01' } }),
  ).toBe('😷')

  expect(
    await data.getPayload('foo', { dateRange: { start: '2019-01-01' } }),
  ).toBe('😷')

  expect(
    await data.getPayload('foo', {
      dateRange: { start: '2019-01-01', end: '2019-12-01' },
    }),
  ).toBe('bar')
})
```
