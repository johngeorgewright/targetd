import { test, expect, beforeEach, afterEach } from 'bun:test'
import { Data } from '@targetd/api'
import z from 'zod'
import dateRangeTargeting from '@targetd/date-range'
import { type SinonFakeTimers, useFakeTimers } from 'sinon'

let clock: SinonFakeTimers

beforeEach(() => {
  clock = useFakeTimers()
})

afterEach(() => {
  clock.restore()
})

test('date range predicate', async () => {
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

  await assertUsingFakeTime('1930-01-01', 'bar')
  await assertUsingFakeTime('1940-01-01', 'WWII')
  await assertUsingFakeTime('2021-01-01', '😷')
  await assertUsingRange({ start: '2020-01-01' }, '😷')
  await assertUsingRange({ start: '2019-01-01' }, '😷')
  await assertUsingRange({ start: '2019-01-01', end: '2019-12-01' }, 'bar')

  async function assertUsingFakeTime(iso: string, expectation: string) {
    clock.setSystemTime(new Date(iso))
    expect(await data.getPayload('foo'), iso).toBe(expectation)
  }

  async function assertUsingRange(
    dateRange: NonNullable<Required<Parameters<typeof data.getPayload<'foo'>>[1]>>['dateRange'],
    expectation: string,
  ) {
    expect(await data.getPayload('foo', { dateRange })).toBe(expectation)
  }
})
