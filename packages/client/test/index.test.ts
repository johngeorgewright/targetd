import { assertSnapshot } from 'jsr:@std/testing/snapshot'
import { afterAll, beforeAll, test } from 'jsr:@std/testing/bdd'
import { expect } from 'jsr:@std/expect'
import { Data, targetEquals, targetIncludes } from '@targetd/api'
import dateRangeTargeting from '@targetd/date-range'
import { createServer } from '@targetd/server'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { setTimeout } from 'node:timers/promises'
import z from 'zod/v4'
import { Client, type ClientWithData } from '@targetd/client'

const schema = Data.create({
  data: {
    foo: z.string(),
    bar: z.number(),
    timed: z.string(),
  },
  targeting: {
    weather: targetIncludes(z.string()),
    highTide: targetEquals(z.boolean()),
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
    ])
  )
  .then((data) =>
    data.addRules('timed', [
      {
        targeting: {
          date: { start: '2001-01-01', end: '2010-01-01' },
        },
        payload: 'in time',
      },
    ])
  )

let client: ClientWithData<Awaited<typeof schema>>
let server: Server

beforeAll(async () => {
  const d = await data
  const serverResolvers = Promise.withResolvers<void>()
  server = createServer(() => d).listen(
    0,
    serverResolvers.resolve,
  )
  await serverResolvers.promise
  const address = server.address() as AddressInfo
  client = new Client(`http://localhost:${address.port}`, schema)
})

afterAll(() => {
  server.close()
})

test('get one data point', async (t) => {
  expect(await client.getPayload('foo')).toBe('bar')
  expect(await client.getPayload('foo', { weather: 'sunny' })).toBe('😎')
  expect(await client.getPayload('foo', { weather: 'rainy' })).toBe('☂️')
  expect(await client.getPayload('foo', { highTide: true })).toBe('🌊')
  expect(
    await client.getPayload('foo', { highTide: true, weather: 'sunny' }),
  ).toBe('🏄‍♂️')
  await assertSnapshot(t, await client.getPayload('foo', { asyncThing: true }))
  await assertSnapshot(
    t,
    await client.getPayload('timed', { date: { start: '2002-01-01' } }),
  )
  expect(
    await client.getPayload('timed', { date: { start: '2012-01-01' } }),
  ).toBe(undefined)
})

test('get all', async (t) => {
  await assertSnapshot(t, await client.getPayloadForEachName())
  await assertSnapshot(
    t,
    await client.getPayloadForEachName({ weather: 'sunny' }),
  )
  await assertSnapshot(
    t,
    await client.getPayloadForEachName({ weather: 'rainy' }),
  )
  await assertSnapshot(
    t,
    await client.getPayloadForEachName({ highTide: true }),
  )
  await assertSnapshot(
    t,
    await client.getPayloadForEachName({ highTide: true, weather: 'sunny' }),
  )
  await assertSnapshot(
    t,
    await client.getPayloadForEachName({ asyncThing: true }),
  )
})
