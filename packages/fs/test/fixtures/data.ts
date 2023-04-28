import { Data } from '@targetd/api'
import { z } from 'zod'

export const data = Data.create()
  .useDataValidator('foo', z.string())
  .useDataValidator('b', z.string())
