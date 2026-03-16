import { test, expect } from 'bun:test'
import { Data, targetEquals, targetIncludes } from '@targetd/api'
import dateRangeTargeting from '@targetd/date-range'
import { createServer } from '@targetd/server'
import type { AddressInfo } from 'node:net'
import { setTimeout } from 'node:timers/promises'
import z from 'zod'
import { Client, type ClientWithData } from '@targetd/client'
import { promisify } from 'node:util'

const data = await Data.create()
  .usePayload({
    foo: z.string(),
    bar: z.number(),
    timed: z.string(),
  })
  .useTargeting({
    weather: targetIncludes(z.string()),
    highTide: targetEquals(z.boolean()),
    asyncThing: {
      predicate: (q) => setTimeout(10, (t) => q === t && setTimeout(10, true)),
      queryParser: z.boolean(),
      targetingParser: z.boolean(),
    },
    date: dateRangeTargeting,
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
  .addRules('timed', [
    {
      targeting: {
        date: { start: '2001-01-01', end: '2010-01-01' },
      },
      payload: 'in time',
    },
  ])

test('get one data point', async () => {
  await using service = await startService()
  const { client } = service

  expect(await client.getPayload('foo')).toBe('bar')
  expect(await client.getPayload('foo', { weather: 'sunny' })).toBe('😎')
  expect(await client.getPayload('foo', { weather: 'rainy' })).toBe('☂️')
  expect(await client.getPayload('foo', { highTide: true })).toBe('🌊')
  expect(await client.getPayload('foo', { highTide: true, weather: 'sunny' })).toBe('🏄‍♂️')
  expect(await client.getPayload('foo', { asyncThing: true })).toMatchSnapshot()
  expect(await client.getPayload('timed', { date: { start: '2002-01-01' } })).toMatchSnapshot()
  expect(await client.getPayload('timed', { date: { start: '2012-01-01' } })).toBe(undefined)
})

test('get all', async () => {
  await using service = await startService()
  const { client } = service

  expect(await client.getPayloadForEachName()).toMatchSnapshot()
  expect(await client.getPayloadForEachName({ weather: 'sunny' })).toMatchSnapshot()
  expect(await client.getPayloadForEachName({ weather: 'rainy' })).toMatchSnapshot()
  expect(await client.getPayloadForEachName({ highTide: true })).toMatchSnapshot()
  expect(await client.getPayloadForEachName({ highTide: true, weather: 'sunny' })).toMatchSnapshot()
  expect(await client.getPayloadForEachName({ asyncThing: true })).toMatchSnapshot()
})

async function startService(): Promise<AsyncDisposable & { client: ClientWithData<typeof data> }> {
  const app = createServer(data)
  const { promise, reject, resolve } = Promise.withResolvers<void>()
  const server = app.listen(0, (error) => (error ? reject(error) : resolve()))
  await promise
  const address = server.address() as AddressInfo
  const client = new Client(`http://localhost:${address.port}`, data)
  return {
    client,
    [Symbol.asyncDispose]: promisify(server.close.bind(server)),
  }
}
