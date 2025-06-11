import { assertSnapshot } from 'jsr:@std/testing/snapshot'
import { afterEach, beforeEach, test } from 'jsr:@std/testing/bdd'
import { Data, targetEquals, targetIncludes } from '@targetd/api'
import dateRangeTargeting from '@targetd/date-range'
import _ from 'npm:lodash'
import type express from 'express'
import { setTimeout } from 'node:timers/promises'
// @ts-types='npm:@types/supertest'
import request from 'npm:supertest'
import z from 'zod'
import { createServer } from '@targetd/server'
import type { Server } from 'node:http'

let app: express.Application
let data: Awaited<ReturnType<typeof createData>>
let server: Server

async function createData() {
  let data = Data.create({
    data: {
      foo: z.string(),
      bar: z.number(),
      timed: z.string(),
    },
    targeting: {
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
    },
  })

  data = await data.addRules('foo', [
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

  data = await data.addRules('bar', [
    {
      payload: 123,
    },
  ])

  data = await data.addRules('timed', [
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

  return data
}

beforeEach(async () => {
  data = await createData()
  app = createServer(() => data)

  const { promise, resolve, reject } = Promise.withResolvers<void>()
  server = app.listen(0, (err) => {
    if (err) reject(err)
    else resolve()
  })
  return promise
})

afterEach(() => {
  return new Promise<void>((resolve, reject) => {
    server.close((err) => {
      if (err) reject(err)
      else resolve()
    })
  })
})

test('get one data point', async () => {
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

test('get all', async (t) => {
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
