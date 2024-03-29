import { Data } from '@targetd/api'
import dateRangeTargeting from '@targetd/date-range'
import { difference } from 'lodash'
import express from 'express'
import { promisify } from 'node:util'
import { setTimeout } from 'node:timers'
import request from 'supertest'
import z from 'zod'
import { createServer } from '../src'

const timeout = promisify(setTimeout)
let app: express.Application

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
      predicate: (q) => timeout(10, (t) => q === t && timeout(10, true)),
      queryParser: z.boolean(),
      targetingParser: z.boolean(),
    },
    arrayThing: {
      predicate: (q) => (t) => difference(q, t).length === 0,
      queryParser: z.string().array(),
      targetingParser: z.string().array(),
    },
    date: dateRangeTargeting,
  },
})

let data: typeof schema

beforeEach(async () => {
  data = await schema.addRules('foo', [
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

  app = createServer(() => data)
})

test('get one data point', async () => {
  let response = await request(app)
    .get('/foo')
    .expect('Content-Type', /json/)
    .expect(200)
  expect(response.body).toBe('bar')

  response = await request(app)
    .get('/foo?weather=sunny')
    .expect('Content-Type', /json/)
    .expect(200)
  expect(response.body).toBe('😎')

  response = await request(app)
    .get('/foo?weather=rainy')
    .expect('Content-Type', /json/)
    .expect(200)
  expect(response.body).toBe('☂️')

  response = await request(app)
    .get('/foo?highTide=true')
    .expect('Content-Type', /json/)
    .expect(200)
  expect(response.body).toBe('🌊')

  response = await request(app)
    .get('/foo?highTide=true&weather=sunny')
    .expect('Content-Type', /json/)
    .expect(200)
  expect(response.body).toBe('🏄‍♂️')

  response = await request(app)
    .get('/foo?asyncThing=true')
    .expect('Content-Type', /json/)
    .expect(200)
  expect(response.body).toBe('Async payload')

  response = await request(app)
    .get('/timed?date[start]=2002-01-01')
    .expect('Content-Type', /json/)
    .expect(200)
  expect(response.body).toBe('in time')

  response = await request(app)
    .get('/timed?date[start]=2012-01-01')
    .expect('Content-Type', /json/)
    .expect(200)
  expect(response.body).toBe('out of time')

  response = await request(app)
    .get('/foo?arrayThing=a')
    .expect('Content-Type', /json/)
    .expect(200)
  expect(response.body).toBe("a t'ing")

  response = await request(app)
    .get('/foo?arrayThing=a&arrayThing=b')
    .expect('Content-Type', /json/)
    .expect(200)
  expect(response.body).toBe("b t'ing")
})

test('get all', async () => {
  let response = await request(app)
    .get('/')
    .expect('Content-Type', /json/)
    .expect(200)
  expect(response.body).toMatchInlineSnapshot(`
    {
      "bar": 123,
      "foo": "bar",
      "timed": "out of time",
    }
  `)

  response = await request(app)
    .get('/?weather=sunny')
    .expect('Content-Type', /json/)
    .expect(200)
  expect(response.body).toMatchInlineSnapshot(`
    {
      "bar": 123,
      "foo": "😎",
      "timed": "out of time",
    }
  `)

  response = await request(app)
    .get('/?weather=rainy')
    .expect('Content-Type', /json/)
    .expect(200)
  expect(response.body).toMatchInlineSnapshot(`
    {
      "bar": 123,
      "foo": "☂️",
      "timed": "out of time",
    }
  `)

  response = await request(app)
    .get('/?highTide=true')
    .expect('Content-Type', /json/)
    .expect(200)
  expect(response.body).toMatchInlineSnapshot(`
    {
      "bar": 123,
      "foo": "🌊",
      "timed": "out of time",
    }
  `)

  response = await request(app)
    .get('/?highTide=true&weather=sunny')
    .expect('Content-Type', /json/)
    .expect(200)
  expect(response.body).toMatchInlineSnapshot(`
    {
      "bar": 123,
      "foo": "🏄‍♂️",
      "timed": "out of time",
    }
  `)

  response = await request(app)
    .get('/?asyncThing=true')
    .expect('Content-Type', /json/)
    .expect(200)
  expect(response.body).toMatchInlineSnapshot(`
    {
      "bar": 123,
      "foo": "Async payload",
      "timed": "out of time",
    }
  `)
})
