import { assertStrictEquals } from 'jsr:@std/assert'
import { FakeTime } from 'jsr:@std/testing/time'
import { Data } from '@targetd/api'
import z from 'zod/v4'
import dateRangeTargeting from '@targetd/date-range'

Deno.test('date range predicate', async () => {
  const data = await Data.create()
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

  let fakeTime = new FakeTime(new Date('1930-01-01'))
  assertStrictEquals(await data.getPayload('foo', {}), 'bar')
  fakeTime.restore()

  fakeTime = new FakeTime(new Date('1940-01-01'))
  assertStrictEquals(await data.getPayload('foo', {}), 'WWII')
  fakeTime.restore()

  fakeTime = new FakeTime(new Date('2021-01-01'))
  assertStrictEquals(await data.getPayload('foo', {}), '😷')
  fakeTime.restore()

  assertStrictEquals(
    await data.getPayload('foo', { dateRange: { start: '2020-01-01' } }),
    '😷',
  )

  assertStrictEquals(
    await data.getPayload('foo', { dateRange: { start: '2019-01-01' } }),
    '😷',
  )

  assertStrictEquals(
    await data.getPayload('foo', {
      dateRange: { start: '2019-01-01', end: '2019-12-01' },
    }),
    'bar',
  )
})
