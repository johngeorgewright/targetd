import { test, expect } from 'bun:test'
import { setTimeout } from 'node:timers/promises'
import z, { type ZodError } from 'zod'
import { createTargetingDescriptor, Data, targetEquals, targetIncludes } from '@targetd/api'

test('getPayload', async () => {
  const data = await Data.create()
    .usePayload({ foo: z.string() })
    .useTargeting({
      weather: targetIncludes(z.string()),
      highTide: targetEquals(z.boolean()),
      asyncThing: {
        predicate: (q) => setTimeout(10, (t: boolean) => q === t && setTimeout(10, true)),
        queryParser: z.boolean(),
        targetingParser: z.boolean(),
      },
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
  expect(await data.getPayload('foo', { highTide: true, weather: 'sunny' })).toBe('🏄‍♂️')
  expect(await data.getPayload('foo', { asyncThing: true })).toBe('Async payload')

  // @ts-expect-error Mung data type does not exist
  await data.getPayload('mung')

  await expect(
    // @ts-expect-error 'nonExistantKey' is not a queriable value
    data.getPayload('foo', { nonExistantKey: 'some value' }),
  ).rejects.toThrow()

  await expect(
    data.addRules('foo', [
      {
        targeting: {
          // @ts-expect-error 'nonExistantKey' is not a targetable value
          nonExistantKey: 'some value',
        },
        payload: 'error',
      },
    ]),
  ).rejects.toThrow()
})

test('targeting with multiple conditions', async () => {
  const data = await Data.create()
    .usePayload({ foo: z.string() })
    .useTargeting({
      weather: targetIncludes(z.string()),
      highTide: targetEquals(z.boolean()),
    })
    .addRules('foo', [
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

  expect(await data.getPayload('foo', { weather: 'sunny' })).toBe('The time is now')
  expect(await data.getPayload('foo', { highTide: true })).toBe('The time is now')
  expect(await data.getPayload('foo')).toBe('bar')
})

test('targeting without requiring a query', async () => {
  const data = await Data.create()
    .usePayload({
      foo: z.string(),
    })
    .useTargeting({
      time: {
        predicate: () => (t) => t === 'now!',
        queryParser: z.undefined(),
        requiresQuery: false,
        targetingParser: z.literal('now!'),
      },
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
  const data = await Data.create()
    .usePayload({
      foo: z.string(),
    })
    .useTargeting({
      weather: targetIncludes(z.string()),
      highTide: targetEquals(z.boolean()),
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

  expect(await data.getPayloads('foo', { weather: 'sunny' })).toMatchSnapshot()
})

test('payload runtype validation', async () => {
  try {
    await Data.create()
      .usePayload({
        foo: z.string().refine((x) => x === 'bar', 'Should be bar'),
      })
      .addRules('foo', [
        {
          payload: 'rab',
        },
      ])
  } catch (error: any) {
    expect(error.message).toMatchSnapshot()
    return
  }

  throw new Error('Didnt error correctly')
})

test('getPayloadForEachName', async () => {
  const data = await Data.create()
    .usePayload({
      foo: z.string(),
      bar: z.string(),
    })
    .useTargeting({
      weather: targetIncludes(z.string()),
      highTide: targetIncludes(z.boolean()),
      asyncThing: {
        predicate: (q) => setTimeout(10, (t: boolean) => q === t && setTimeout(10, true)),
        queryParser: z.boolean(),
        targetingParser: z.boolean(),
      },
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

  expect(await data.getPayloadForEachName({ weather: 'sunny' })).toMatchSnapshot()
  expect(await data.getPayloadForEachName({ asyncThing: true })).toMatchSnapshot()
})

test('fallThrough targeting', async () => {
  const data = await Data.create()
    .usePayload({
      foo: z.string(),
      bar: z.string(),
      mung: z.string(),
    })
    .useTargeting({ surf: targetIncludes(z.string(), { withNegate: true }) })
    .useFallThroughTargeting({ weather: z.array(z.string()) })
    .addRules('foo', [
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
        payload: '😐',
      },
    ])
    .addRules('mung', [
      {
        targeting: {
          surf: ['!strong'],
          weather: ['rainy'],
        },
        payload: '☂️',
      },
      {
        targeting: {
          surf: ['strong'],
          weather: ['sunny'],
        },
        payload: '🏄‍♂️',
      },
    ])

  expect(data.data).toMatchSnapshot()
  expect(await data.getPayloadForEachName({ surf: 'tame' })).toMatchSnapshot()
  expect(await data.getPayloadForEachName({ surf: 'strong' })).toMatchSnapshot()
})

test('inserting data', async () => {
  const data = await Data.create()
    .usePayload({
      moo: z.string(),
      foo: z.string(),
      bar: z.string(),
    })
    .useTargeting({
      weather: targetIncludes(z.string()),
    })
    .useFallThroughTargeting({
      highTide: targetEquals(z.boolean()),
    })
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

  expect(await data.getPayloadForEachName({ weather: 'sunny' })).toMatchSnapshot()
})

test('inserting data with variables', async () => {
  const data = await Data.create()
    .usePayload({
      moo: z.string(),
      foo: z.string(),
      bar: z.string(),
    })
    .useTargeting({
      weather: targetIncludes(z.string()),
      highTide: targetEquals(z.boolean()),
    })
    .insert({
      bar: {
        __variables__: {
          highTide: [
            {
              payload: '😟',
              targeting: {
                highTide: false,
              },
            },
            {
              payload: '😁',
            },
          ],
        },
        __rules__: [
          {
            payload: '{{highTide}}',
            targeting: {},
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

  expect(await data.getPayloadForEachName({ weather: 'sunny', highTide: true })).toMatchSnapshot()
})

test('targeting predicate with full query object', async () => {
  const mungTargeting = createTargetingDescriptor({
    queryParser: z.string(),
    targetingParser: z.string().array(),
    predicate:
      (queryValue, { bar }: { bar?: boolean }) =>
      (targeting) =>
        bar === true && queryValue !== undefined && targeting.includes(queryValue),
  })

  const data = await Data.create()
    .usePayload({
      foo: z.string(),
    })
    .useTargeting({
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
    })
    .addRules('foo', [
      {
        targeting: { mung: ['mung'] },
        payload: 'yay',
      },
    ])

  expect(await data.getPayload('foo')).toBe(undefined)
  expect(await data.getPayload('foo', { mung: 'mung' })).toBe(undefined)
  expect(await data.getPayload('foo', { bar: true, mung: 'mung' })).toBe('yay')
})

test('broken', async () => {
  const browserTargeting = targetIncludes(z.enum(['chrome', 'edge']))

  const channelTargeting = targetIncludes(z.enum(['foo', 'bar']))

  const payloadSchema = {
    foo: z.string(),
  }

  const data = await Data.create()
    .usePayload(payloadSchema)
    .useTargeting({
      channel: channelTargeting,
    })
    .useFallThroughTargeting({
      browser: browserTargeting,
    })
    .addRules('foo', [
      {
        targeting: {
          channel: ['foo'],
        },
        payload: 'face',
      },
      {
        targeting: {
          channel: ['bar'],
          browser: ['chrome'],
        },
        payload: 'yay',
      },
      {
        targeting: {
          channel: ['bar'],
          browser: ['edge'],
        },
        payload: 'nay',
      },
    ])

  expect(await data.getPayloadForEachName({ channel: 'foo' })).toMatchSnapshot()
  expect(await data.getPayloadForEachName({ channel: 'bar' })).toMatchSnapshot()
})

test('variables', async () => {
  const data = await Data.create()
    .usePayload({
      foo: z.strictObject({
        a: z.strictObject({
          b: z.strictObject({
            c: z.string(),
            d: z.number(),
          }),
        }),
      }),
    })
    .useTargeting({
      channel: targetIncludes(z.enum(['foo', 'bar'])),
    })
    .useFallThroughTargeting({
      browser: targetIncludes(z.enum(['chrome', 'edge'])),
    })
    .addRules('foo', {
      variables: {
        c: [
          {
            targeting: {
              channel: ['bar'],
            },
            payload: 'foo',
          },
          {
            payload: 'bar',
          },
        ],
        d: [{ payload: 1 }],
      },
      rules: [
        {
          payload: {
            a: {
              b: {
                c: '{{c}}',
                d: '{{d}}',
              },
            },
          },
        },
      ],
    })

  expect(await data.getPayload('foo', { channel: 'bar' })).toMatchSnapshot()

  expect(await data.getPayload('foo')).toMatchSnapshot()
})

test('variables using fallthrough targeting', async () => {
  const data = await Data.create()
    .usePayload({
      foo: z.strictObject({
        a: z.strictObject({
          b: z.strictObject({
            c: z.string(),
            d: z.number(),
          }),
        }),
      }),
    })
    .useTargeting({
      channel: targetIncludes(z.enum(['foo', 'bar'])),
    })
    .useFallThroughTargeting({
      browser: targetIncludes(z.enum(['chrome', 'edge'])),
    })
    .addRules('foo', {
      variables: {
        c: [
          {
            targeting: {
              browser: ['chrome'],
            },
            payload: '1',
          },
          {
            payload: '2',
          },
        ],
        d: [{ payload: 1 }],
      },
      rules: [
        {
          targeting: {
            channel: ['bar'],
          },
          payload: {
            a: {
              b: {
                c: '{{c}}',
                d: '{{d}}',
              },
            },
          },
        },
      ],
    })

  expect(await data.getPayload('foo', { channel: 'bar' })).toMatchSnapshot()
})

test('variables in records', async () => {
  const data = await Data.create()
    .usePayload({
      foo: z.record(z.string(), z.array(z.number())),
    })
    .addRules('foo', {
      variables: {
        a: [{ payload: [1, 2, 3] }],
      },
      rules: [{ payload: { a: '{{a}}' } }],
    })

  const payload = await data.getPayload('foo')
  expect(payload).toEqual({ a: [1, 2, 3] })
})

test('variables in arrays', async () => {
  const data = await Data.create()
    .usePayload({
      foo: z.array(z.number()),
      bar: z.array(
        z.strictObject({
          b: z.number(),
          c: z.string(),
        }),
      ),
    })
    .addRules('foo', {
      variables: {
        a: [{ payload: 1 }],
      },
      rules: [{ payload: ['{{a}}'] }],
    })
    .addRules('bar', {
      variables: {
        b: [{ payload: 2 }],
        c: [{ payload: '3' }],
      },
      rules: [{ payload: [{ b: '{{b}}', c: '{{c}}' }] }],
    })

  expect(data.data).toMatchSnapshot()

  expect(await data.getPayload('foo')).toEqual([1])

  expect(await data.getPayload('bar')).toEqual([{ b: 2, c: '3' }])
})

test('errors when using variables with incorrect types', async () => {
  const data = await Data.create().usePayload({
    foo: z.strictObject({
      a: z.strictObject({
        b: z.strictObject({
          c: z.string(),
        }),
      }),
    }),
  })

  expect(
    await data
      .addRules('foo', {
        variables: {
          c: [
            {
              payload: 2,
            },
          ],
        },
        rules: [
          {
            payload: {
              a: {
                b: {
                  c: '{{c}}',
                },
              },
            },
          },
        ],
      })
      .catch((error: ZodError) => error.issues),
  ).toMatchSnapshot()
})

test('make sure fallthrough targeting predicates are not called', async () => {
  const minInnerWindowWidthTargeting = createTargetingDescriptor({
    queryParser: z.unknown(),
    targetingParser: z.number(),
    requiresQuery: false,
    predicate: () => () => {
      throw new Error('This should never get called')
    },
  })
  const baseSchema = Data.create().usePayload({ foo: z.string() })
  const clientSchema = baseSchema.useTargeting({ fft: minInnerWindowWidthTargeting })
  const serverSchema = baseSchema
    .useFallThroughTargeting((await clientSchema).targetingParsers)
    .addRules('foo', {
      variables: {
        x: [
          {
            targeting: {
              fft: 129,
            },
            payload: 'fft',
          },
          {
            payload: 'st',
          },
        ],
      },
      rules: [{ payload: '{{x}}' }],
    })
  await serverSchema.getPayloadForEachName()
})
