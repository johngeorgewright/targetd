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

  await assertUsingFakeTime('1930-01-01', 'bar')
  await assertUsingFakeTime('1940-01-01', 'WWII')
  await assertUsingFakeTime('2021-01-01', '😷')
  await assertUsingRange({ start: '2020-01-01' }, '😷')
  await assertUsingRange({ start: '2019-01-01' }, '😷')
  await assertUsingRange({ start: '2019-01-01', end: '2019-12-01' }, 'bar')

  async function assertUsingFakeTime(iso: string, expectation: string) {
    using _ = fakeTime(iso)
    assertStrictEquals(await data.getPayload('foo'), expectation)
  }

  async function assertUsingRange(
    dateRange: NonNullable<
      Required<Parameters<typeof data.getPayload<'foo'>>[1]>
    >['dateRange'],
    expectation: string,
  ) {
    assertStrictEquals(
      await data.getPayload('foo', { dateRange }),
      expectation,
    )
  }
})

function fakeTime(iso: string): Disposable {
  const fakeTime = new FakeTime(iso)
  return { [Symbol.dispose]: () => fakeTime.restore() }
}
