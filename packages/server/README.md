# @targetd/server

> HTTP server for targetd data

## Exammple

```typescript
import { Data, zod as z } from '@targetd/api',
import { createServer } from '@targetd/server'

const data = Data.create()
  .useDataValidator('foo', z.string())
  .useDataValidator('b', z.string())

createServer(data).listen(8080)
```
