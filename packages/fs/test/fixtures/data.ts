import { Data } from '@targetd/api'
import { z } from 'zod'

export const data = Data.create()
  .useDataParser('foo', z.string())
  .useDataParser('b', z.string())
