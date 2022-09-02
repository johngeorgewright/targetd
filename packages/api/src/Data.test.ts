import Data from './Data'
import * as rt from 'runtypes'
import { setTimeout } from 'node:timers/promises'

test('getPayload', async () => {
  const data = Data.create()
    .useDataValidator('foo', rt.String)
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
      predicate: (q) => setTimeout(10, (t) => q === t && setTimeout(10, true)),
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
      {
        targeting: {
          // @ts-expect-error
          nonExistantKey: 'some value',
        },
        payload: 'error',
      },
    ])

  expect(await data.getPayload('foo', {})).toBe('bar')
  expect(await data.getPayload('foo', { weather: 'sunny' })).toBe('😎')
  expect(await data.getPayload('foo', { weather: 'rainy' })).toBe('☂️')
  expect(await data.getPayload('foo', { highTide: true })).toBe('🌊')
  expect(
    await data.getPayload('foo', { highTide: true, weather: 'sunny' })
  ).toBe('🏄‍♂️')
  expect(await data.getPayload('foo', { asyncThing: true })).toBe(
    'Async payload'
  )
  // @ts-expect-error
  await data.getPayload('mung', {})
  // @ts-expect-error
  await data.getPayload('foo', { nonExistantKey: 'some value' })
})

test('targeting without requiring a query', async () => {
  const data = Data.create()
    .useDataValidator('foo', rt.String)
    .useTargeting('time', {
      predicate: () => (t) => t === 'now!',
      queryValidator: rt.Undefined,
      requiresQuery: false,
      targetingValidator: rt.Literal('now!'),
    })
    .addRules('foo', [
      {
        targeting: {
          time: 'now!',
        },
        payload: 'The time is now',
      },
      {
        payload: 'bar',
      },
    ])

  expect(await data.getPayload('foo', {})).toBe('The time is now')
})

test('getPayloads', async () => {
  const data = Data.create()
    .useDataValidator('foo', rt.String)
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
    .addRules('foo', [
      {
        targeting: {
          weather: ['sunny'],
        },
        payload: '😎',
      },
      {
        targeting: {
          weather: ['rainy', 'sunny'],
        },
        payload: '☂️',
      },
      {
        targeting: {
          highTide: true,
        },
        payload: '🏄‍♂️',
      },
      {
        payload: 'bar',
      },
    ])

  expect(await data.getPayloads('foo', { weather: 'sunny' }))
    .toMatchInlineSnapshot(`
    Array [
      "😎",
      "☂️",
      "bar",
    ]
  `)
})

test('payload runtype validation', () => {
  try {
    Data.create()
      .useDataValidator(
        'foo',
        rt.String.withConstraint((x) => x === 'bar' || 'Should be bar')
      )
      .addRules('foo', [
        {
          payload: 'rab',
        },
      ])
  } catch (error: any) {
    expect(error.details).toMatchInlineSnapshot(`
      Object {
        "foo": Object {
          "rules": Array [
            "Expected { targeting?: {}; payload: string; } | { targeting?: {}; client: { targeting?: {}; payload: string; }[]; }, but was object",
          ],
        },
      }
    `)
    return
  }

  throw new Error('Didnt error correctly')
})

test('getPayloadForEachName', async () => {
  const data = Data.create()
    .useDataValidator('foo', rt.String)
    .useDataValidator('bar', rt.String)
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
      predicate: (q) => setTimeout(10, (t) => q === t && setTimeout(10, true)),
      queryValidator: rt.Boolean,
      targetingValidator: rt.Boolean,
    })
    .addRules('foo', [
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
    ])
    .addRules('bar', [
      {
        targeting: {
          weather: ['rainy'],
        },
        payload: '😟',
      },
      {
        targeting: {
          weather: ['sunny'],
        },
        payload: '😁',
      },
      {
        targeting: {
          asyncThing: true,
        },
        payload: 'async payloads!',
      },
    ])

  expect(await data.getPayloadForEachName({ weather: 'sunny' }))
    .toMatchInlineSnapshot(`
    Object {
      "bar": "😁",
      "foo": "😎",
    }
  `)

  expect(await data.getPayloadForEachName({ asyncThing: true }))
    .toMatchInlineSnapshot(`
    Object {
      "bar": "async payloads!",
      "foo": undefined,
    }
  `)
})
