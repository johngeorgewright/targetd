import { Data } from '@targetd/api'
import { z } from 'zod'

export const data = Data.create().useData({
  foo: z.string(),
  b: z.string(),
})
