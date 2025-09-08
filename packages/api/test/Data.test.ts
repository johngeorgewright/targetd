import { assertRejects, assertStrictEquals } from 'jsr:@std/assert'
import { assertSnapshot } from 'jsr:@std/testing/snapshot'
import { setTimeout } from 'node:timers/promises'
import z, { type ZodError } from 'zod'
import {
  createTargetingDescriptor,
  Data,
  targetEquals,
  targetIncludes,
} from '@targetd/api'

Deno.test('getPayload', async () => {
  const data = await Data.create()
    .usePayload({ 'foo': z.string() })
    .useTargeting({
      weather: targetIncludes(z.string()),
      highTide: targetEquals(z.boolean()),
      asyncThing: {
        predicate: (q) =>
          setTimeout(10, (t: boolean) => q === t && setTimeout(10, true)),
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

  assertStrictEquals(await data.getPayload('foo'), 'bar')
  assertStrictEquals(await data.getPayload('foo', { weather: 'sunny' }), '😎')
  assertStrictEquals(await data.getPayload('foo', { weather: 'rainy' }), '☂️')
  assertStrictEquals(await data.getPayload('foo', { highTide: true }), '🌊')
  assertStrictEquals(
    await data.getPayload('foo', { highTide: true, weather: 'sunny' }),
    '🏄‍♂️',
  )
  assertStrictEquals(
    await data.getPayload('foo', { asyncThing: true }),
    'Async payload',
  )

  // @ts-expect-error Mung data type does not exist
  await data.getPayload('mung')

  await assertRejects(() =>
    // @ts-expect-error 'nonExistantKey' is not a queriable value
    data.getPayload('foo', { nonExistantKey: 'some value' })
  )

  await assertRejects(() =>
    data.addRules('foo', [
      {
        targeting: {
          // @ts-expect-error 'nonExistantKey' is not a targetable value
          nonExistantKey: 'some value',
        },
        payload: 'error',
      },
    ])
  )
})

Deno.test('targeting with multiple conditions', async () => {
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

  assertStrictEquals(
    await data.getPayload('foo', { weather: 'sunny' }),
    'The time is now',
  )
  assertStrictEquals(
    await data.getPayload('foo', { highTide: true }),
    'The time is now',
  )
  assertStrictEquals(await data.getPayload('foo'), 'bar')
})

Deno.test('targeting without requiring a query', async () => {
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

  assertStrictEquals(await data.getPayload('foo'), 'The time is now')
})

Deno.test('getPayloads', async (t) => {
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

  await assertSnapshot(t, await data.getPayloads('foo', { weather: 'sunny' }))
})

Deno.test('payload runtype validation', async (t) => {
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
    await assertSnapshot(t, error.message)
    return
  }

  throw new Error('Didnt error correctly')
})

Deno.test('getPayloadForEachName', async (t) => {
  const data = await Data.create()
    .usePayload({
      foo: z.string(),
      bar: z.string(),
    })
    .useTargeting({
      weather: targetIncludes(z.string()),
      highTide: targetIncludes(z.boolean()),
      asyncThing: {
        predicate: (q) =>
          setTimeout(10, (t: boolean) => q === t && setTimeout(10, true)),
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

  await assertSnapshot(
    t,
    await data.getPayloadForEachName({ weather: 'sunny' }),
  )
  await assertSnapshot(
    t,
    await data.getPayloadForEachName({ asyncThing: true }),
  )
})

Deno.test('fallThrough targeting', async (t) => {
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

  await assertSnapshot(t, data.data)
  await assertSnapshot(t, await data.getPayloadForEachName({ surf: 'tame' }))
  await assertSnapshot(t, await data.getPayloadForEachName({ surf: 'strong' }))
})

Deno.test('inserting data', async (t) => {
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

  await assertSnapshot(
    t,
    await data.getPayloadForEachName({ weather: 'sunny' }),
  )
})

Deno.test('inserting data with variables', async (t) => {
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

  await assertSnapshot(
    t,
    await data.getPayloadForEachName({ weather: 'sunny', highTide: true }),
  )
})

Deno.test('targeting predicate with full query object', async () => {
  const mungTargeting = createTargetingDescriptor({
    queryParser: z.string(),
    targetingParser: z.string().array(),
    predicate: (queryValue, { bar }: { bar?: boolean }) => (targeting) =>
      bar === true &&
      queryValue !== undefined &&
      targeting.includes(queryValue),
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

  assertStrictEquals(await data.getPayload('foo'), undefined)
  assertStrictEquals(await data.getPayload('foo', { mung: 'mung' }), undefined)
  assertStrictEquals(
    await data.getPayload('foo', { bar: true, mung: 'mung' }),
    'yay',
  )
})

Deno.test('broken', async (t) => {
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

  await assertSnapshot(t, await data.getPayloadForEachName({ channel: 'foo' }))
  await assertSnapshot(t, await data.getPayloadForEachName({ channel: 'bar' }))
})

Deno.test('variables', async (t) => {
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
        d: [
          { payload: 1 },
        ],
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

  assertSnapshot(t, await data.getPayload('foo', { channel: 'bar' }))

  assertSnapshot(t, await data.getPayload('foo'))
})

Deno.test('variables using fallthrough targeting', async (t) => {
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
        d: [
          { payload: 1 },
        ],
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

  assertSnapshot(t, await data.getPayload('foo', { channel: 'bar' }))
})

Deno.test('errors when using variables with incorrect types', async (t) => {
  const data = await Data.create()
    .usePayload({
      foo: z.strictObject({
        a: z.strictObject({
          b: z.strictObject({
            c: z.string(),
          }),
        }),
      }),
    })

  assertSnapshot(
    t,
    await data.addRules('foo', {
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
    }).catch((error: ZodError) => error.issues),
  )
})

Deno.test(
  'make sure fallthrough targeting is not added to the predicate',
  async () => {
    const minInnerWindowWidthTargeting = createTargetingDescriptor({
      queryParser: z.unknown(),
      targetingParser: z.number(),
      requiresQuery: false,
      predicate: () => () => {
        throw new Error('This should never get called')
      },
    })
    const baseSchema = Data.create()
      .usePayload({ 'foo': z.string() })
    const clientSchema = baseSchema
      .useTargeting({ fft: minInnerWindowWidthTargeting })
    const serverSchema = baseSchema
      .useFallThroughTargeting((await clientSchema).targetingParsers)
      .addRules('foo', {
        variables: {
          x: [{
            targeting: {
              fft: 129,
            },
            payload: 'fft',
          }, {
            payload: 'st',
          }],
        },
        rules: [
          { payload: '{{x}}' },
        ],
      })
    await serverSchema.getPayloadForEachName()
  },
)
