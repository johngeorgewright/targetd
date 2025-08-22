# @targetd/date-range

> Adds date range targeting

## Installation

| JS Runtime | Command                                             |
| ---------- | --------------------------------------------------- |
| Node.js    | `npx jsr add @targetd/api @targetd/date-range`      |
| Bun        | `bunx jsr add @targetd/api @targetd/date-range`     |
| Deno       | `deno add jsr:@targetd/api jsr:@targetd/date-range` |

## Example

```typescript
import { Data } from 'jsr:@targetd/api'
import dateRangeTargeting from 'jsr:@targetd/date-range'
import { assertStrictEquals } from 'jsr:@std/assert'
import z from 'npm:zod'

const data = Data.create()
  .usePayload({
    foo: z.string(),
  })
  .useTargeting({
    dateRange: dateRangeTargeting,
  })
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
