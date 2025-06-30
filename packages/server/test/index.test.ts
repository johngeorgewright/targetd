import { assertSnapshot } from 'jsr:@std/testing/snapshot'
import { Data, targetEquals, targetIncludes } from '@targetd/api'
import dateRangeTargeting from '@targetd/date-range'
import _ from 'npm:lodash'
import { setTimeout } from 'node:timers/promises'
// @ts-types='npm:@types/supertest'
import request from 'npm:supertest'
import z from 'zod/v4'
import { createServer } from '@targetd/server'
import { promisify } from 'node:util'

Deno.test('get one data point', async () => {
  await using disposable = await createDisposableServer()
  const { server } = disposable

  await request(server)
    .get('/foo')
    .expect('Content-Type', /json/)
    .expect(200)
    .expect('"bar"')

  await request(server)
    .get('/foo?weather=sunny')
    .expect('Content-Type', /json/)
    .expect(200)
    .expect('"😎"')

  await request(server)
    .get('/foo?weather=rainy')
    .expect('Content-Type', /json/)
    .expect(200)
    .expect('"☂️"')

  await request(server)
    .get('/foo?highTide=true')
    .expect('Content-Type', /json/)
    .expect(200)
    .expect('"🌊"')

  await request(server)
    .get('/foo?highTide=true&weather=sunny')
    .expect('Content-Type', /json/)
    .expect(200)
    .expect('"🏄‍♂️"')

  await request(server)
    .get('/foo?asyncThing=true')
    .expect('Content-Type', /json/)
    .expect(200)
    .expect('"Async payload"')

  await request(server)
    .get('/timed?date[start]=2002-01-01')
    .expect('Content-Type', /json/)
    .expect(200)
    .expect('"in time"')

  await request(server)
    .get('/timed?date[start]=2012-01-01')
    .expect('Content-Type', /json/)
    .expect(200)
    .expect('"out of time"')

  await request(server)
    .get('/foo?arrayThing=a')
    .expect('Content-Type', /json/)
    .expect(200)
    .expect('"a t\'ing"')

  await request(server)
    .get('/foo?arrayThing=a&arrayThing=b')
    .expect('Content-Type', /json/)
    .expect(200)
    .expect('"b t\'ing"')
})

Deno.test('get all', async (t) => {
  await using disposable = await createDisposableServer()
  const { server } = disposable

  let response = await request(server)
    .get('/')
    .expect('Content-Type', /json/)
    .expect(200)
  await assertSnapshot(t, response.body)

  response = await request(server)
    .get('/?weather=sunny')
    .expect('Content-Type', /json/)
    .expect(200)
  await assertSnapshot(t, response.body)

  response = await request(server)
    .get('/?weather=rainy')
    .expect('Content-Type', /json/)
    .expect(200)
  await assertSnapshot(t, response.body)

  response = await request(server)
    .get('/?highTide=true')
    .expect('Content-Type', /json/)
    .expect(200)
  await assertSnapshot(t, response.body)

  response = await request(server)
    .get('/?highTide=true&weather=sunny')
    .expect('Content-Type', /json/)
    .expect(200)
  await assertSnapshot(t, response.body)

  response = await request(server)
    .get('/?asyncThing=true')
    .expect('Content-Type', /json/)
    .expect(200)
  await assertSnapshot(t, response.body)
})

async function createDisposableServer() {
  const app = createServer(await createData())
  const { promise, resolve } = Promise.withResolvers<void>()
  const server = app.listen(0, resolve)
  await promise
  return {
    server,
    [Symbol.asyncDispose]: promisify(server.close.bind(server)),
  }
}

async function createData() {
  return await Data.create()
    .usePayload({
      foo: z.string(),
      bar: z.number(),
      timed: z.string(),
    })
    .useTargeting({
      weather: targetIncludes(z.string()),
      highTide: targetEquals(z.boolean()),
      asyncThing: {
        predicate: (q) =>
          setTimeout(10, (t) => q === t && setTimeout(10, true)),
        queryParser: z.boolean(),
        targetingParser: z.boolean(),
      },
      arrayThing: {
        predicate: (q) => (t) => _.difference(q, t).length === 0,
        queryParser: z.string().array(),
        targetingParser: z.string().array(),
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
        targeting: {
          arrayThing: ['a'],
        },
        payload: "a t'ing",
      },
      {
        targeting: {
          arrayThing: ['a', 'b'],
        },
        payload: "b t'ing",
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
      {
        payload: 'out of time',
      },
    ])
}
