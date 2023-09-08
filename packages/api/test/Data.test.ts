import z from 'zod'
import { Data, equalsPredicate, targetIncludesPredicate } from '../src'

const timeout = <T>(ms: number, returnValue: T) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(returnValue), ms))

test('getPayload', async () => {
  const data = Data.create()
    .useDataValidator('foo', z.string())
    .useTargeting('weather', {
      predicate: targetIncludesPredicate(),
      queryValidator: z.string(),
      targetingValidator: z.array(z.string()),
    })
    .useTargeting('highTide', {
      predicate: equalsPredicate(),
      queryValidator: z.boolean(),
      targetingValidator: z.boolean(),
    })
    .useTargeting('asyncThing', {
      predicate: (q) => timeout(10, (t) => q === t && timeout(10, true)),
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

  expect(await data.getPayload('foo')).toBe('bar')
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
  await data.getPayload('mung')

  expect(
    // @ts-expect-error
    data.getPayload('foo', { nonExistantKey: 'some value' })
  ).rejects.toThrow()

  expect(() =>
    data.addRules('foo', [
      {
        targeting: {
          // @ts-expect-error
          nonExistantKey: 'some value',
        },
        payload: 'error',
      },
    ])
  ).toThrow()
})

test('targeting without requiring a query', async () => {
  const data = Data.create()
    .useDataValidator('foo', z.string())
    .useTargeting('time', {
      predicate: () => (t) => t === 'now!',
      queryValidator: z.undefined(),
      requiresQuery: false,
      targetingValidator: z.literal('now!'),
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

  expect(await data.getPayload('foo')).toBe('The time is now')
})

test('getPayloads', async () => {
  const data = Data.create()
    .useDataValidator('foo', z.string())
    .useTargeting('weather', {
      predicate: targetIncludesPredicate(),
      queryValidator: z.string(),
      targetingValidator: z.array(z.string()),
    })
    .useTargeting('highTide', {
      predicate: equalsPredicate(),
      queryValidator: z.boolean(),
      targetingValidator: z.boolean(),
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
    [
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
        z.string().refine((x) => x === 'bar', 'Should be bar')
      )
      .addRules('foo', [
        {
          payload: 'rab',
        },
      ])
  } catch (error: any) {
    expect(error).toMatchInlineSnapshot(`
      [ZodError: [
        {
          "code": "custom",
          "message": "Should be bar",
          "path": [
            "foo",
            "rules",
            0,
            "payload"
          ]
        }
      ]]
    `)
    return
  }

  throw new Error('Didnt error correctly')
})

test('getPayloadForEachName', async () => {
  const data = Data.create()
    .useDataValidator('foo', z.string())
    .useDataValidator('bar', z.string())
    .useTargeting('weather', {
      predicate: targetIncludesPredicate(),
      queryValidator: z.string(),
      targetingValidator: z.array(z.string()),
    })
    .useTargeting('highTide', {
      predicate: equalsPredicate(),
      queryValidator: z.boolean(),
      targetingValidator: z.boolean(),
    })
    .useTargeting('asyncThing', {
      predicate: (q) => timeout(10, (t) => q === t && timeout(10, true)),
      queryValidator: z.boolean(),
      targetingValidator: z.boolean(),
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
    {
      "bar": "😁",
      "foo": "😎",
    }
  `)

  expect(await data.getPayloadForEachName({ asyncThing: true }))
    .toMatchInlineSnapshot(`
    {
      "bar": "async payloads!",
      "foo": undefined,
    }
  `)
})

test('fallThrough targeting', async () => {
  const data = Data.create()
    .useDataValidator('foo', z.string())
    .useDataValidator('bar', z.string())
    .useFallThroughTargeting('weather', z.array(z.string()))
    .useFallThroughTargeting('highTide', z.boolean())
    .addRules('foo', [
      {
        fallThrough: [
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
        ],
      },
    ])
    .addRules('bar', [
      {
        fallThrough: [
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
        ],
      },
    ])

  expect(await data.getPayloadForEachName()).toMatchInlineSnapshot(`
    {
      "bar": {
        "__rules__": [
          {
            "payload": "😟",
            "targeting": {
              "weather": [
                "rainy",
              ],
            },
          },
          {
            "payload": "😁",
            "targeting": {
              "weather": [
                "sunny",
              ],
            },
          },
        ],
      },
      "foo": {
        "__rules__": [
          {
            "payload": "😎",
            "targeting": {
              "weather": [
                "sunny",
              ],
            },
          },
          {
            "payload": "☂️",
            "targeting": {
              "weather": [
                "rainy",
              ],
            },
          },
        ],
      },
    }
  `)
})

test('inserting data', async () => {
  const data = Data.create()
    .useDataValidator('moo', z.string())
    .useDataValidator('foo', z.string())
    .useDataValidator('bar', z.string())
    .useTargeting('weather', {
      predicate: targetIncludesPredicate(),
      queryValidator: z.string(),
      targetingValidator: z.array(z.string()),
    })
    .useFallThroughTargeting('highTide', z.boolean())
    .insert({
      bar: {
        __rules__: [
          {
            payload: '😟',
            targeting: {
              highTide: false,
            },
          },
          {
            payload: '😁',
            targeting: {
              highTide: true,
            },
          },
        ],
      },
      foo: {
        __rules__: [
          {
            payload: '😎',
            targeting: {
              weather: ['sunny'],
            },
          },
          {
            payload: '☂️',
            targeting: {
              weather: ['rainy'],
            },
          },
        ],
      },
      moo: 'glue',
    })

  expect(await data.getPayloadForEachName({ weather: 'sunny' }))
    .toMatchInlineSnapshot(`
    {
      "bar": {
        "__rules__": [
          {
            "payload": "😟",
            "targeting": {
              "highTide": false,
            },
          },
          {
            "payload": "😁",
            "targeting": {
              "highTide": true,
            },
          },
        ],
      },
      "foo": "😎",
      "moo": "glue",
    }
  `)
})
