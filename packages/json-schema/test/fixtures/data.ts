import { Data, targetIncludes } from '@targetd/api'
import z from 'zod'

export const data = await Data.create()
  .usePayload(
    {
      foo: z.string(),
    },
  )
  .useTargeting({
    weather: targetIncludes(z.string()),
  })
  .useFallThroughTargeting({
    browser: targetIncludes(z.string()),
  })
  .addRules('foo', [
    {
      payload: 'bar',
    },
  ])
