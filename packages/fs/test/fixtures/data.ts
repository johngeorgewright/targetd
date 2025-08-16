import { Data } from '@targetd/api'
import { z } from 'zod'

export const data = await Data.create()
  .usePayload({
    foo: z.string(),
    b: z.string(),
  })
