import { Data, runtypes as rt } from '@targetd/api'
import express from 'express'
import { promisify } from 'node:util'
import { setTimeout } from 'node:timers'
import request from 'supertest'
import { createServer } from '.'

const timeout = promisify(setTimeout)
let app: express.Application

beforeEach(() => {
  app = createServer(
    Data.create()
      .useDataValidator('foo', rt.String)
      .useDataValidator('bar', rt.Number)
      .useTargeting('weather', {
        predicate: (q) => (t) => typeof q === 'string' && t.includes(q),
        queryValidator: rt.String,
        targetingValidator: rt.Array(rt.String),
      })
      .useTargeting('highTide', {
        predicate: (q) => (t) => q === t,
        queryValidator: rt.Boolean,
        targetingValidator: rt.Boolean,
      })
      .useTargeting('asyncThing', {
        predicate: (q) => timeout(10, (t) => q === t && timeout(10, true)),
        queryValidator: rt.Boolean,
        targetingValidator: rt.Boolean,
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
  )
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
    }
  `)
})
