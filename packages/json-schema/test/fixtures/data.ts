import { Data, DataSchema, targetIncludes } from '@targetd/api'
import { z } from 'zod/mini'

export const data = await Data.create(
  DataSchema.create()
    .usePayload(
      {
        foo: z.string(),
        bar: z.strictObject({
          a: z.number(),
          b: z.array(z.string()),
        }),
        record: z.record(z.string(), z.number()),
        array: z.array(z.number()),
      },
    )
    .useTargeting({
      weather: targetIncludes(z.string()),
    })
    .useFallThroughTargeting({
      browser: targetIncludes(z.string()),
    })
    .build(),
)
  .addRules('foo', {
    variables: {
      weatherMessage: [
        {
          targeting: {
            weather: ['sunny'],
          },
          payload: 'sunshine',
        },
        {
          targeting: {
            weather: ['rainy'],
          },
          payload: 'raindrops',
        },
        {
          payload: 'weather',
        },
      ],
    },
    rules: [
      {
        targeting: {
          weather: ['sunny'],
        },
        payload: '{{weatherMessage}}',
      },
      {
        payload: 'default message',
      },
    ],
  })
  .addRules('bar', [
    {
      payload: {
        a: 123,
        b: ['a', 'b'],
      },
    },
  ])
  .addRules('record', [
    {
      payload: {
        a: 123,
      },
    },
  ])
