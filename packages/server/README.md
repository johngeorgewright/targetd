# @targetd/server

> HTTP server for targetd data

## Exammple

```typescript
import { Data } from '@targetd/api',
import { createServer } from '@targetd/server'
import z from 'zod'

const data = Data.create({
  data: {
    foo: z.string(),
    b: z.string()
  }
})

createServer(data).listen(8080)
```
