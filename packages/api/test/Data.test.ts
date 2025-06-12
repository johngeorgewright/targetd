import { assertSnapshot } from 'jsr:@std/testing/snapshot'
import { test } from 'jsr:@std/testing/bdd'
import { expect } from 'jsr:@std/expect'
import { setTimeout } from 'node:timers/promises'
import z from 'zod'
import {
  createTargetingDescriptor,
  Data,
  targetEquals,
  targetIncludes,
} from '@targetd/api'

test('getPayload', async () => {
  let data = Data.create({
    data: {
      foo: z.string(),
    },
    targeting: {
      weather: targetIncludes(z.string()),
      highTide: targetEquals(z.boolean()),
      asyncThing: {
        predicate: (q) =>
          setTimeout(10, (t: boolean) => q === t && setTimeout(10, true)),
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

test('getPayloads', async (t) => {
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

  await assertSnapshot(t, await data.getPayloads('foo', { weather: 'sunny' }))
})

test('payload runtype validation', async (t) => {
  try {
    let data = Data.create({
      data: {
        foo: z.string().refine((x) => x === 'bar', 'Should be bar'),
      },
    })

    data = await data.addRules('foo', [
      {
        // @ts-expect-error Type '"rab"' is not assignable to type '"bar"'
        payload: 'rab',
      },
    ])
  } catch (error: any) {
    await assertSnapshot(t, error.message)
    return
  }

  throw new Error('Didnt error correctly')
})

test('getPayloadForEachName', async (t) => {
  let data = Data.create({
    data: {
      foo: z.string(),
      bar: z.string(),
    },
    targeting: {
      weather: targetIncludes(z.string()),
      highTide: targetIncludes(z.boolean()),
      asyncThing: {
        predicate: (q) =>
          setTimeout(10, (t: boolean) => q === t && setTimeout(10, true)),
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

  await assertSnapshot(
    t,
    await data.getPayloadForEachName({ weather: 'sunny' }),
  )
  await assertSnapshot(
    t,
    await data.getPayloadForEachName({ asyncThing: true }),
  )
})

test('fallThrough targeting', async (t) => {
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

  await assertSnapshot(t, data.data)
})

test('inserting data', async (t) => {
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

  await assertSnapshot(
    t,
    await data.getPayloadForEachName({ weather: 'sunny' }),
  )
})

test('targeting predicate with full query object', async () => {
  const mungTargeting = createTargetingDescriptor({
    queryParser: z.string(),
    targetingParser: z.string().array(),
    predicate: (queryValue, { bar }: { bar?: boolean }) => (targeting) =>
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

test('broken', async (t) => {
  const browserTargeting = targetIncludes(z.enum(['chrome', 'edge']))

  const channelTargeting = targetIncludes(z.enum(['foo', 'bar']))

  const payloadSchema = {
    foo: z.string(),
  }

  const serverSchema = Data.create({
    data: payloadSchema,
    targeting: {
      channel: channelTargeting,
    },
    fallThroughTargeting: {
      browser: browserTargeting,
    },
  })

  const data = await serverSchema.addRules('foo', [
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
