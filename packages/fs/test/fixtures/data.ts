import { Data } from '@targetd/api'
import { z } from 'zod'

export const data = Data.create({
  data: {
    foo: z.string(),
    b: z.string(),
  },
})
