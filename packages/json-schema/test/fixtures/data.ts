import { Data, targetIncludes } from '@targetd/api'
import z from 'zod'

export const data = await Data.create()
  .usePayload(
    {
      foo: z.string(),
      bar: z.strictObject({
        a: z.number(),
        b: z.array(z.string()),
      }),
    },
  )
  .useTargeting({
    weather: targetIncludes(z.string()),
  })
  .useFallThroughTargeting({
    browser: targetIncludes(z.string()),
  })
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
