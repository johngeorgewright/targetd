import { Data } from '@targetd/api'
import dateRangeTargeting from '@targetd/date-range'
import { createServer } from '@targetd/server'
import { Server } from 'node:http'
import { setTimeout } from 'node:timers/promises'
import { z } from 'zod'
import { Client, ClientWithData } from '../src'

const schema = Data.create({
  data: {
    foo: z.string(),
    bar: z.number(),
    timed: z.string(),
  },
  targeting: {
    weather: {
      predicate: (q) => (t) => typeof q === 'string' && t.includes(q),
      queryParser: z.string(),
      targetingParser: z.array(z.string()),
    },
    highTide: {
      predicate: (q) => (t) => q === t,
      queryParser: z.boolean(),
      targetingParser: z.boolean(),
    },
    asyncThing: {
      predicate: (q) => setTimeout(10, (t) => q === t && setTimeout(10, true)),
      queryParser: z.boolean(),
      targetingParser: z.boolean(),
    },
    date: dateRangeTargeting,
  },
})

const data = schema
  .addRules('foo', [
    {
      targeting: {
        highTide: true,
        weather: ['sunny'],
      },
      payload: '🏄‍♂️',
    },
    {
      targeting: {
        weather: ['sunny'],
      },
      payload: '😎',
    },
    {
      targeting: {
        weather: ['rainy'],
      },
      payload: '☂️',
    },
    {
      targeting: {
        highTide: true,
      },
      payload: '🌊',
    },
    {
      targeting: {
        asyncThing: true,
      },
      payload: 'Async payload',
    },
    {
      payload: 'bar',
    },
  ])
  .then((data) =>
    data.addRules('bar', [
      {
        payload: 123,
      },
    ]),
  )
  .then((data) =>
    data.addRules('timed', [
      {
        targeting: {
          date: { start: '2001-01-01', end: '2010-01-01' },
        },
        payload: 'in time',
      },
    ]),
  )

let client: ClientWithData<Awaited<typeof schema>>
let server: Server

beforeAll(async () => {
  const d = await data
  server = createServer(() => d).listen(3_000)
  client = new Client(`http://localhost:3000`, schema)
})

afterAll(() => {
  server.close()
})

test('get one data point', async () => {
  expect(await client.getPayload('foo')).toBe('bar')
  expect(await client.getPayload('foo', { weather: 'sunny' })).toBe('😎')
  expect(await client.getPayload('foo', { weather: 'rainy' })).toBe('☂️')
  expect(await client.getPayload('foo', { highTide: true })).toBe('🌊')
  expect(
    await client.getPayload('foo', { highTide: true, weather: 'sunny' }),
  ).toBe('🏄‍♂️')
  expect(
    await client.getPayload('foo', { asyncThing: true }),
  ).toMatchInlineSnapshot(`"Async payload"`)
  expect(
    await client.getPayload('timed', { date: { start: '2002-01-01' } }),
  ).toMatchInlineSnapshot(`"in time"`)
  expect(
    await client.getPayload('timed', { date: { start: '2012-01-01' } }),
  ).toBe(undefined)
})

test('get all', async () => {
  expect(await client.getPayloadForEachName()).toMatchInlineSnapshot(`
    {
      "bar": 123,
      "foo": "bar",
    }
  `)

  expect(await client.getPayloadForEachName({ weather: 'sunny' }))
    .toMatchInlineSnapshot(`
    {
      "bar": 123,
      "foo": "😎",
    }
  `)

  expect(await client.getPayloadForEachName({ weather: 'rainy' }))
    .toMatchInlineSnapshot(`
    {
      "bar": 123,
      "foo": "☂️",
    }
  `)

  expect(await client.getPayloadForEachName({ highTide: true }))
    .toMatchInlineSnapshot(`
    {
      "bar": 123,
      "foo": "🌊",
    }
  `)

  expect(
    await client.getPayloadForEachName({ highTide: true, weather: 'sunny' }),
  ).toMatchInlineSnapshot(`
    {
      "bar": 123,
      "foo": "🏄‍♂️",
    }
  `)

  expect(await client.getPayloadForEachName({ asyncThing: true }))
    .toMatchInlineSnapshot(`
    {
      "bar": 123,
      "foo": "Async payload",
    }
  `)
})
