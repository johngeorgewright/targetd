import { Data } from '@targetd/api'
import { createServer } from '@targetd/server'
import { Server } from 'node:http'
import { setTimeout } from 'node:timers/promises'
import { z } from 'zod'
import { Client, ClientWithData } from '../src'

const data = Data.create()
  .useDataValidator('foo', z.string())
  .useDataValidator('bar', z.number())
  .useTargeting('weather', {
    predicate: (q) => (t) => typeof q === 'string' && t.includes(q),
    queryValidator: z.string(),
    targetingValidator: z.array(z.string()),
  })
  .useTargeting('highTide', {
    predicate: (q) => (t) => q === t,
    queryValidator: z.boolean(),
    targetingValidator: z.boolean(),
  })
  .useTargeting('asyncThing', {
    predicate: (q) => setTimeout(10, (t) => q === t && setTimeout(10, true)),
    queryValidator: z.boolean(),
    targetingValidator: z.boolean(),
  })
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
  .addRules('bar', [
    {
      payload: 123,
    },
  ])

let client: ClientWithData<typeof data>
let server: Server

beforeEach(() => {
  server = createServer(() => data).listen(3_000)
  client = new Client(`http://localhost:3000`, data)
})

afterEach(() => {
  server.close()
})

test('get one data point', async () => {
  expect(await client.getPayload('foo')).toBe('bar')
  expect(await client.getPayload('foo', { weather: 'sunny' })).toBe('😎')
  expect(await client.getPayload('foo', { weather: 'rainy' })).toBe('☂️')
  expect(await client.getPayload('foo', { highTide: true })).toBe('🌊')
  expect(
    await client.getPayload('foo', { highTide: true, weather: 'sunny' })
  ).toBe('🏄‍♂️')
  expect(
    await client.getPayload('foo', { asyncThing: true })
  ).toMatchInlineSnapshot(`"Async payload"`)
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
    await client.getPayloadForEachName({ highTide: true, weather: 'sunny' })
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
