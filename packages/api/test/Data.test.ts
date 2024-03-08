import z from 'zod'
import {
  Data,
  createTargetingDescriptor,
  targetEquals,
  targetIncludes,
} from '../src'

const timeout = <T>(ms: number, returnValue: T) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(returnValue), ms))

test('getPayload', async () => {
  let data = Data.create({
    data: {
      foo: z.string(),
    },
    targeting: {
      weather: targetIncludes(z.string()),
      highTide: targetEquals(z.boolean()),
      asyncThing: {
        predicate: (q) => timeout(10, (t) => q === t && timeout(10, true)),
        queryParser: z.boolean(),
        targetingParser: z.boolean(),
      },
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
      payload: 'bar',
    },
  ])

  expect(await data.getPayload('foo')).toBe('bar')
  expect(await data.getPayload('foo', { weather: 'sunny' })).toBe('😎')
  expect(await data.getPayload('foo', { weather: 'rainy' })).toBe('☂️')
  expect(await data.getPayload('foo', { highTide: true })).toBe('🌊')
  expect(
    await data.getPayload('foo', { highTide: true, weather: 'sunny' }),
  ).toBe('🏄‍♂️')
  expect(await data.getPayload('foo', { asyncThing: true })).toBe(
    'Async payload',
  )

  // @ts-expect-error
  await data.getPayload('mung')

  expect(
    // @ts-expect-error
    data.getPayload('foo', { nonExistantKey: 'some value' }),
  ).rejects.toThrow()

  expect(
    data.addRules('foo', [
      {
        targeting: {
          // @ts-expect-error
          nonExistantKey: 'some value',
        },
        payload: 'error',
      },
    ]),
  ).rejects.toThrow()
})

test('targeting with multiple conditions', async () => {
  let data = Data.create({
    data: {
      foo: z.string(),
    },
    targeting: {
      weather: targetIncludes(z.string()),
      highTide: targetEquals(z.boolean()),
    },
  })

  data = await data.addRules('foo', [
    {
      targeting: [
        {
          weather: ['sunny'],
        },
        {
          highTide: true,
        },
      ],
      payload: 'The time is now',
    },
    {
      payload: 'bar',
    },
  ])

  expect(await data.getPayload('foo', { weather: 'sunny' })).toBe(
    'The time is now',
  )
  expect(await data.getPayload('foo', { highTide: true })).toBe(
    'The time is now',
  )
  expect(await data.getPayload('foo')).toBe('bar')
})

test('targeting without requiring a query', async () => {
  let data = Data.create({
    data: {
      foo: z.string(),
    },
    targeting: {
      time: {
        predicate: () => (t) => t === 'now!',
        queryParser: z.undefined(),
        requiresQuery: false,
        targetingParser: z.literal('now!'),
      },
    },
  })

  data = await data.addRules('foo', [
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
  let data = Data.create({
    data: {
      foo: z.string(),
    },
    targeting: {
      weather: targetIncludes(z.string()),
      highTide: targetEquals(z.boolean()),
    },
  })

  data = await data.addRules('foo', [
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

test('payload runtype validation', async () => {
  try {
    let data = Data.create({
      data: {
        foo: z.string().refine((x) => x === 'bar', 'Should be bar'),
      },
    })

    data = await data.addRules('foo', [
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
  let data = Data.create({
    data: {
      foo: z.string(),
      bar: z.string(),
    },
    targeting: {
      weather: targetIncludes(z.string()),
      highTide: targetIncludes(z.boolean()),
      asyncThing: {
        predicate: (q) => timeout(10, (t) => q === t && timeout(10, true)),
        queryParser: z.boolean(),
        targetingParser: z.boolean(),
      },
    },
  })

  data = await data.addRules('foo', [
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

  data = await data.addRules('bar', [
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
  let data = Data.create({
    data: {
      foo: z.string(),
      bar: z.string(),
    },
    targeting: { surf: targetIncludes(z.string()) },
    fallThroughTargeting: { weather: z.array(z.string()) },
  })

  data = await data.addRules('foo', [
    {
      targeting: {
        surf: ['strong'],
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
  ])
  data = await data.addRules('bar', [
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
  ])

  expect(data.data).toMatchInlineSnapshot(`
    {
      "bar": {
        "rules": [
          {
            "fallThrough": [
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
            "targeting": {},
          },
        ],
      },
      "foo": {
        "rules": [
          {
            "fallThrough": [
              {
                "payload": "🏄‍♂️",
                "targeting": {
                  "weather": [
                    "sunny",
                  ],
                },
              },
            ],
            "targeting": {
              "surf": [
                "strong",
              ],
            },
          },
          {
            "fallThrough": [
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
            "targeting": {},
          },
        ],
      },
    }
  `)
})

test('inserting data', async () => {
  let data = Data.create({
    data: {
      moo: z.string(),
      foo: z.string(),
      bar: z.string(),
    },
    targeting: {
      weather: targetIncludes(z.string()),
    },
    fallThroughTargeting: {
      highTide: targetEquals(z.boolean()),
    },
  })

  data = await data.insert({
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

test('targeting predicate with full query object', async () => {
  const mungTargeting = createTargetingDescriptor({
    queryParser: z.string(),
    targetingParser: z.string().array(),
    predicate:
      (queryValue, { bar }: { bar?: boolean }) =>
      (targeting) =>
        bar === true &&
        queryValue !== undefined &&
        targeting.includes(queryValue),
  })

  let data = Data.create({
    data: {
      foo: z.string(),
    },
    targeting: {
      oof: {
        queryParser: z.string(),
        targetingParser: z.string(),
        predicate: (q) => (t) => q === t,
      },
      bar: {
        queryParser: z.boolean(),
        targetingParser: z.boolean(),
        predicate: (q) => (t) => q === t,
      },
      mung: mungTargeting,
    },
  })

  data = await data.addRules('foo', [
    {
      targeting: { mung: ['mung'] },
      payload: 'yay',
    },
  ])

  expect(await data.getPayload('foo')).toBe(undefined)
  expect(await data.getPayload('foo', { mung: 'mung' })).toBe(undefined)
  expect(await data.getPayload('foo', { bar: true, mung: 'mung' })).toBe('yay')
})
