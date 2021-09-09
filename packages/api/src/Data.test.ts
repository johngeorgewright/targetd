import Data from './Data'
import * as rt from 'runtypes'

test('getPayload', () => {
  let now = ''

  const config = Data.create()
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
    .useTargeting('time', {
      predicate: () => (t) => t === now,
      queryValidator: rt.Undefined,
      requiresQuery: false,
      targetingValidator: rt.Literal('now!'),
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
      {
        targeting: {
          highTide: true,
        },
        payload: '🏄‍♂️',
      },
      {
        targeting: {
          time: 'now!',
        },
        payload: 'The time is now',
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

  expect(config.getPayload('foo', {})).toBe('bar')
  expect(config.getPayload('foo', { weather: 'sunny' })).toBe('😎')
  expect(config.getPayload('foo', { weather: 'rainy' })).toBe('☂️')
  expect(config.getPayload('foo', { highTide: true })).toBe('🏄‍♂️')
  // @ts-expect-error
  config.getPayload('mung', {})
  // @ts-expect-error
  config.getPayload('foo', { nonExistantKey: 'some value' })
})

test('targeting without requiring a query', () => {
  const config = Data.create()
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

  expect(config.getPayload('foo', {})).toBe('The time is now')
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
