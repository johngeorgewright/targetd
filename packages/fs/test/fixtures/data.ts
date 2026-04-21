import { Data, DataSchema, targetIncludes } from '@targetd/api'
import { string, z } from 'zod'

export const data = await Data.create(
  DataSchema.create()
    .usePayload({
      foo: z.string(),
      b: z.string(),
    })
    .useTargeting({ channel: targetIncludes(string()) }),
)
