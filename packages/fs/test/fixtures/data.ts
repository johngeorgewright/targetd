import { Data, zod as z } from '@targetd/api'

export const data = Data.create()
  .useDataValidator('foo', z.string())
  .useDataValidator('b', z.string())
