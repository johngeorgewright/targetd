import { test } from 'jsr:@std/testing/bdd'
import { FakeTime } from 'jsr:@std/testing/time'
import { expect } from 'jsr:@std/expect'
import { Data } from '@targetd/api'
import z from 'zod/v4'
import dateRangeTargeting from '@targetd/date-range'

test('date range predicate', async () => {
  const data = await Data.create({
    targeting: {
      dateRange: dateRangeTargeting,
    },
    data: {
      foo: z.string(),
    },
  }).addRules('foo', [
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
  expect(await data.getPayload('foo', {})).toBe('bar')
  fakeTime.restore()

  fakeTime = new FakeTime(new Date('1940-01-01'))
  expect(await data.getPayload('foo', {})).toBe('WWII')
  fakeTime.restore()

  fakeTime = new FakeTime(new Date('2021-01-01'))
  expect(await data.getPayload('foo', {})).toBe('😷')
  fakeTime.restore()

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
